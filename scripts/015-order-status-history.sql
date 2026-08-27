-- ============================================================
-- Migration 015: order_status_history
-- ============================================================
-- A timeline of every status change on an order, for both the customer
-- and business views. Populated automatically by triggers — app code
-- never has to remember to write a history row, it just updates
-- orders.status like it already does today, and a row appears here too.
--
-- Note on status values: orders.status currently has no CHECK constraint
-- in this database — it accepts any text. I'm deliberately NOT adding one
-- here either, to avoid guessing at the exact set of status strings your
-- app actually writes (a quick grep found at least "pending", but I don't
-- have full visibility into every status transition in the codebase).
-- Once you've confirmed the real set in use, adding a shared CHECK
-- constraint to both orders.status and this table is a good tightening
-- pass — just not something I want to guess at and risk rejecting a
-- legitimate status your app already relies on.

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id uuid NOT NULL
    REFERENCES public.orders(id) ON DELETE CASCADE,

  status text NOT NULL,

  changed_by_user_id uuid
    REFERENCES public.profiles(id) ON DELETE SET NULL,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Same visibility as the parent order — no direct writes from the
-- frontend at all, only the triggers below ever insert here.
CREATE POLICY "Customers can view history on their own orders"
  ON public.order_status_history FOR SELECT
  USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

CREATE POLICY "Business owners can view history on their orders"
  ON public.order_status_history FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.businesses b ON b.id = o.business_id
      WHERE b.user_id = auth.uid()
    )
  );

-- Log the initial status the moment an order is created.
CREATE OR REPLACE FUNCTION public.handle_new_order_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.order_status_history (order_id, status, changed_by_user_id)
  VALUES (NEW.id, NEW.status, NEW.customer_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_log_status ON public.orders;
CREATE TRIGGER on_order_created_log_status
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_order_status_history();

-- Log every subsequent status change.
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, status, changed_by_user_id)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_updated ON public.orders;
CREATE TRIGGER on_order_status_updated
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_change();
