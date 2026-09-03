-- ============================================================
-- Migration 013: customer_addresses
-- ============================================================
-- A customer's saved address book. Fully independent of everything else
-- in this batch — orders/bookings keep using their own flat delivery
-- fields for now (that stays as the permanent historical snapshot on
-- each order, per the design doc's reasoning: if a customer edits or
-- deletes a saved address, past orders must still show what was
-- actually delivered where). Linking orders.delivery_address_id to this
-- table is a later, optional step — not required for this table to be
-- useful on its own (e.g. a checkout "choose a saved address" picker).

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,

  label text NOT NULL DEFAULT 'Home',

  recipient_name text NOT NULL,
  phone text NOT NULL,

  country text NOT NULL,
  city text NOT NULL,
  area text,

  street_address text NOT NULL,
  building text,
  apartment text,

  delivery_notes text,

  is_default boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);

-- Only one default address per customer.
CREATE UNIQUE INDEX IF NOT EXISTS one_default_address_per_user
  ON public.customer_addresses(user_id)
  WHERE is_default = true;

CREATE OR REPLACE FUNCTION public.handle_customer_addresses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_customer_address_updated ON public.customer_addresses;
CREATE TRIGGER on_customer_address_updated
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_customer_addresses_updated_at();

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- A customer can fully manage only their own addresses. No business-side
-- access at all — businesses only ever see the frozen snapshot on an
-- order, never this table directly.
CREATE POLICY "Users can view their own addresses"
  ON public.customer_addresses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own addresses"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own addresses"
  ON public.customer_addresses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own addresses"
  ON public.customer_addresses FOR DELETE
  USING (user_id = auth.uid());
