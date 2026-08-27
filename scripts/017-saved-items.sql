-- ============================================================
-- Migration 017: saved_items
-- ============================================================
-- The one piece of new schema this specific feature actually needs:
-- letting a personal-account user save/like a business, product, or
-- service so it shows up in their own dashboard. Fully independent of
-- migrations 012–016 — those solve different problems (business staff
-- roles, order integrity, confirmation security), not this one.

CREATE TABLE IF NOT EXISTS public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Exactly one of these three is set per row — a saved item is always
  -- "a business" OR "a product" OR "a service," never a combination.
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT saved_items_exactly_one_target CHECK (
    (business_id IS NOT NULL)::int + (product_id IS NOT NULL)::int + (service_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON public.saved_items(user_id);

-- Prevent saving the same thing twice. Three separate partial unique
-- indexes rather than one combined UNIQUE(user_id, business_id,
-- product_id, service_id) — a single multi-column UNIQUE constraint
-- wouldn't actually catch duplicates here, since Postgres treats two
-- NULLs as distinct, and two rows saving the same business_id would
-- still have NULL/NULL in the other two columns.
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_unique_business
  ON public.saved_items(user_id, business_id) WHERE business_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_unique_product
  ON public.saved_items(user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_unique_service
  ON public.saved_items(user_id, service_id) WHERE service_id IS NOT NULL;

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Purely private to the user — no business-side visibility into who
-- saved their listing, at least not in this migration.
CREATE POLICY "Users can view their own saved items"
  ON public.saved_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can save items"
  ON public.saved_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own saved items"
  ON public.saved_items FOR DELETE
  USING (user_id = auth.uid());
