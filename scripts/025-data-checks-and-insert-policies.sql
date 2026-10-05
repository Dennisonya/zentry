-- 025: database-side guards that back up the form validation, and closes
-- the open INSERT policies that the current frontend no longer needs.
--
-- Safe to apply before PR #4 deploys: the live frontend already
--   * creates bookings only when signed in, with customer_id = auth.uid()
--     and status 'inquiry' (components/service-inquiry-dialog.tsx);
--   * never writes order_items (order lines live in orders.order_items);
--   * records page views on the server with the service-role key, which
--     bypasses RLS (lib/analytics.ts).
-- The orders/notifications policies stay until 024 (after PR #4 deploys).

-- ---------------------------------------------------------------- checks
-- NOT VALID + VALIDATE so the check of existing rows doesn't hold a long lock.

ALTER TABLE public.products
  ADD CONSTRAINT products_price_nonnegative CHECK (price >= 0) NOT VALID,
  ADD CONSTRAINT products_stock_nonnegative CHECK (stock_quantity IS NULL OR stock_quantity >= 0) NOT VALID,
  ADD CONSTRAINT products_low_stock_nonnegative CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0) NOT VALID;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_stock_nonnegative CHECK (stock_quantity IS NULL OR stock_quantity >= 0) NOT VALID,
  ADD CONSTRAINT product_variants_low_stock_nonnegative CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0) NOT VALID;

ALTER TABLE public.services
  ADD CONSTRAINT services_price_nonnegative CHECK (price >= 0) NOT VALID,
  ADD CONSTRAINT services_duration_positive CHECK (duration_minutes IS NULL OR duration_minutes > 0) NOT VALID;

ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_discount_positive CHECK (discount_value > 0) NOT VALID,
  ADD CONSTRAINT promotions_percentage_max CHECK (discount_type <> 'percentage' OR discount_value <= 100) NOT VALID,
  ADD CONSTRAINT promotions_dates_ordered CHECK (end_date > start_date) NOT VALID;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_nonnegative CHECK (total_amount >= 0) NOT VALID;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_price_nonnegative CHECK (price IS NULL OR price >= 0) NOT VALID;

ALTER TABLE public.products VALIDATE CONSTRAINT products_price_nonnegative;
ALTER TABLE public.products VALIDATE CONSTRAINT products_stock_nonnegative;
ALTER TABLE public.products VALIDATE CONSTRAINT products_low_stock_nonnegative;
ALTER TABLE public.product_variants VALIDATE CONSTRAINT product_variants_stock_nonnegative;
ALTER TABLE public.product_variants VALIDATE CONSTRAINT product_variants_low_stock_nonnegative;
ALTER TABLE public.services VALIDATE CONSTRAINT services_price_nonnegative;
ALTER TABLE public.services VALIDATE CONSTRAINT services_duration_positive;
ALTER TABLE public.promotions VALIDATE CONSTRAINT promotions_discount_positive;
ALTER TABLE public.promotions VALIDATE CONSTRAINT promotions_percentage_max;
ALTER TABLE public.promotions VALIDATE CONSTRAINT promotions_dates_ordered;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_total_nonnegative;
ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_price_nonnegative;

-- ---------------------------------------------------------------- bookings
-- The price on a new booking comes from the service (and its best live
-- promotion, same rules as place_order / lib/promotions.ts), never from
-- the browser.

CREATE OR REPLACE FUNCTION public.set_booking_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base numeric;
  v_price numeric;
  v_candidate numeric;
  v_promo record;
BEGIN
  IF NEW.service_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT round(s.price, 2) INTO v_base
  FROM public.services s
  WHERE s.id = NEW.service_id AND s.business_id = NEW.business_id;

  IF v_base IS NULL THEN
    RAISE EXCEPTION 'This service is not offered by this business.' USING ERRCODE = 'check_violation';
  END IF;

  v_price := v_base;
  FOR v_promo IN
    SELECT pr.discount_type, pr.discount_value
    FROM public.promotions pr
    WHERE pr.business_id = NEW.business_id
      AND pr.is_active = true
      AND pr.start_date <= now()
      AND pr.end_date > now()
      AND pr.discount_value > 0
      AND (
        pr.applies_to = 'all'
        OR EXISTS (SELECT 1 FROM public.promotion_services ps
                   WHERE ps.promotion_id = pr.id AND ps.service_id = NEW.service_id)
      )
  LOOP
    IF v_promo.discount_type = 'fixed' THEN
      v_candidate := greatest(0, v_base - v_promo.discount_value);
    ELSE
      v_candidate := greatest(0, v_base * (1 - least(100, greatest(0, v_promo.discount_value)) / 100));
    END IF;
    v_price := least(v_price, round(v_candidate, 2));
  END LOOP;

  NEW.price := v_price;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_booking_price() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_booking_price ON public.bookings;
CREATE TRIGGER set_booking_price
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_price();

-- Only a signed-in customer can create a booking, only for themselves, only
-- as a new inquiry/request.
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can request bookings for themselves" ON public.bookings;
CREATE POLICY "Customers can request bookings for themselves" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND coalesce(status, 'inquiry') IN ('inquiry', 'pending')
  );

-- ---------------------------------------------------------------- unused writes

-- Nothing writes order_items; anyone could attach rows to any order.
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Page views are recorded server-side with the service-role key.
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
