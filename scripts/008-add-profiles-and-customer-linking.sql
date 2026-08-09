-- ============================================================
-- Migration 008: Profiles + customer linking (personal accounts)
-- ============================================================
-- Additive model: one auth user can be personal AND own a business.
-- default_view is a routing preference only — never an access gate.
-- Business dashboard access remains gated by owning a businesses row.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  default_view TEXT NOT NULL DEFAULT 'personal'
    CHECK (default_view IN ('personal', 'business')),
  intended_plan TEXT
    CHECK (intended_plan IS NULL OR intended_plan IN ('basic', 'pro', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile from signup metadata (works before email confirmation)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acct_type TEXT;
  plan TEXT;
  view_default TEXT;
BEGIN
  acct_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal');
  plan := NEW.raw_user_meta_data->>'intended_plan';
  view_default := CASE WHEN acct_type = 'business' THEN 'business' ELSE 'personal' END;

  IF plan IS NOT NULL AND plan NOT IN ('basic', 'pro', 'premium') THEN
    plan := NULL;
  END IF;

  INSERT INTO public.profiles (id, default_view, intended_plan)
  VALUES (NEW.id, view_default, plan)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, default_view)
SELECT
  u.id,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.businesses b WHERE b.user_id = u.id)
      THEN 'business'
    ELSE 'personal'
  END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Customer linking on orders (may already exist from 005)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Customer linking on bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);

-- Customers can read their own orders/bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Customers can view their own orders'
  ) THEN
    CREATE POLICY "Customers can view their own orders"
      ON public.orders FOR SELECT
      USING (customer_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Customers can view their own bookings'
  ) THEN
    CREATE POLICY "Customers can view their own bookings"
      ON public.bookings FOR SELECT
      USING (customer_id = auth.uid());
  END IF;
END $$;
