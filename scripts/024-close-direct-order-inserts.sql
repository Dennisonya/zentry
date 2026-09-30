-- ============================================================
-- Migration 024: close direct order and notification inserts
-- ============================================================
-- Apply AFTER 023 and after the frontend that calls place_order() is live.
-- Before this runs, anyone with the public anon key can insert an order at
-- any price, or spam any business's notification feed.

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
