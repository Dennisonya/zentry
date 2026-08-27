-- ============================================================
-- Migration 014: order_items (real table)
-- ============================================================
-- Adds a proper, queryable/joinable order_items table.
--
-- Important: orders.order_items (the existing jsonb column) is left
-- completely untouched by this migration. This new table is a SEPARATE,
-- additive thing that lives alongside it — a column named order_items on
-- the orders table and a table named order_items are not a naming
-- conflict in Postgres (different namespaces), they just both exist.
--
-- Why not migrate/rename the jsonb column in this same migration: your
-- order-creation code (enhanced-order-dialog.tsx) currently writes
-- directly to that jsonb column, and the dashboard's "top products"
-- calculation (dashboard-overview.tsx) reads it back out. Renaming or
-- dropping it here would break order creation the moment this migration
-- runs, unless the app code changes in the exact same deploy. Since
-- these are two different kinds of changes (SQL vs. TypeScript) I'm
-- keeping them decoupled: this migration is safe to run today with zero
-- app changes required, and doesn't break anything that exists.
--
-- Follow-up (not in this migration, needs app code changes first):
--   1. Update order creation to insert into this table instead of (or
--      in addition to, during a transition period) the jsonb column.
--   2. Update dashboard-overview.tsx's product-sales aggregation and
--      anywhere else reading order.order_items to query this table.
--   3. Only once nothing reads the jsonb column anymore, a later cleanup
--      migration can rename it to order_items_snapshot (keeping the
--      historical data) or drop it.

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id uuid NOT NULL
    REFERENCES public.orders(id) ON DELETE CASCADE,

  product_id uuid
    REFERENCES public.products(id) ON DELETE SET NULL,

  -- Snapshotted at order time, same reasoning as delivery address:
  -- products can change name/image/price later, but the order must
  -- keep showing what was actually purchased.
  product_name text NOT NULL,
  product_image_url text,

  unit_price numeric(12, 2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  total numeric(12, 2) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Access mirrors the parent order: the customer who placed it, or the
-- business (owner today; business_members owners/managers/staff once
-- the other tables' policies are extended to recognize that table).
CREATE POLICY "Customers can view items on their own orders"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

CREATE POLICY "Business owners can view items on their orders"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.businesses b ON b.id = o.business_id
      WHERE b.user_id = auth.uid()
    )
  );

-- Order items are created as part of placing an order (same "anyone can
-- create orders" openness as the orders table itself — guest checkout
-- needs this). Tightened later by the create_order() RPC once that's built.
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);
