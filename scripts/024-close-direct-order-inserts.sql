-- ============================================================
-- Migration 024: close direct order and notification inserts
-- ============================================================
-- Apply AFTER 023 and after the frontend that calls place_order() is live.
-- Before this runs, anyone with the public anon key can insert an order at
-- any price, or spam any business's notification feed.

DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

-- Leftovers from 025. On the live project these were neutralised with
-- WITH CHECK (false) on 2026-10-05; dropping them just tidies up.
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
