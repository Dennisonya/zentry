-- ============================================================
-- Migration 012: business_members
-- ============================================================
-- Introduces multi-role access to a business (owner / manager / staff)
-- without touching businesses.user_id, which keeps working exactly as
-- it does today (the original owner reference). This table is additive
-- only — nothing existing depends on it yet, so it's safe to test in
-- isolation before anything else in this batch builds on it.
--
-- Style note: this project consistently uses TEXT + CHECK for status-like
-- columns rather than Postgres ENUM types (see subscription_plan,
-- subscription_status). Keeping that convention here for consistency —
-- easier to extend the allowed values later without an ALTER TYPE.

CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  business_id uuid NOT NULL
    REFERENCES public.businesses(id) ON DELETE CASCADE,

  user_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,

  role text NOT NULL DEFAULT 'staff'
    CHECK (role IN ('owner', 'manager', 'staff')),

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON public.business_members(user_id);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- A member can see their own membership row (so the app can tell them
-- which businesses they belong to and in what role).
CREATE POLICY "Members can view their own membership"
  ON public.business_members FOR SELECT
  USING (user_id = auth.uid());

-- The business owner can see, add, update, and remove members.
CREATE POLICY "Business owners can view all members"
  ON public.business_members FOR SELECT
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Business owners can add members"
  ON public.business_members FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Business owners can update members"
  ON public.business_members FOR UPDATE
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- Can't remove the owner row via this path — protects against an owner
-- accidentally locking themselves out of their own business.
CREATE POLICY "Business owners can remove non-owner members"
  ON public.business_members FOR DELETE
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    AND role != 'owner'
  );

-- Auto-create the owner's membership row whenever a business is created,
-- so app code never has to remember to do it — same pattern as the
-- subscription-downgrade trigger from migration 011.
CREATE OR REPLACE FUNCTION public.handle_new_business_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner')
  ON CONFLICT (business_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_business_created ON public.businesses;
CREATE TRIGGER on_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_business_owner_membership();

-- Backfill: create owner rows for any businesses that already exist.
-- A no-op today since businesses has 0 rows, but safe to run at any point.
INSERT INTO public.business_members (business_id, user_id, role)
SELECT id, user_id, 'owner' FROM public.businesses
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Reusable helper for future policies/RPCs that need "does this user have
-- at least this level of access to this business" — not wired into any
-- other table's RLS yet (orders/products/services/bookings still key off
-- businesses.user_id directly). Extending those to recognize managers/staff
-- is a natural next step once this table is validated, not part of this migration.
CREATE OR REPLACE FUNCTION public.is_business_member(check_business_id uuid, min_role text DEFAULT 'staff')
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = check_business_id
      AND user_id = auth.uid()
      AND (
        min_role = 'staff'
        OR (min_role = 'manager' AND role IN ('owner', 'manager'))
        OR (min_role = 'owner' AND role = 'owner')
      )
  );
$$;
