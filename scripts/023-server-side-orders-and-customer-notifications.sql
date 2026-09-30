-- ============================================================
-- Migration 023: server-side order placement + customer notifications
-- ============================================================
-- Additive only: safe to apply while the old frontend is still live.
--
-- 1. place_order(): the only supported way to create an order. Prices,
--    promotions and the total are read from the database, never from the
--    browser, and stock is checked and decremented in the same transaction
--    (row locks, no read-then-write race). Replaces the client-side insert
--    and the client-side decrementStockForOrder(), which RLS silently
--    blocked for customers (only owners may update products/variants).
-- 2. Owners may insert their own business notifications (inventory +/-
--    stepper); place_order() inserts low/out-of-stock alerts itself.
-- 3. customer_notifications: a per-customer feed filled by triggers when an
--    order is placed or its status changes, and when a booking's status
--    changes. Customers can read their rows and mark them read.
--
-- Migration 024 then closes the old direct-insert paths. Apply it once the
-- frontend that calls place_order() is deployed.

-- ------------------------------------------------------------
-- 1. place_order()
-- ------------------------------------------------------------
-- p_items: [{ "product_id": uuid, "variant_id": uuid|null, "quantity": int }]
CREATE OR REPLACE FUNCTION public.place_order(
  p_business_id uuid,
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_qty integer;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_variant_id uuid;
  v_variant_label text;
  v_base numeric;
  v_price numeric;
  v_badge text;
  v_promo record;
  v_candidate numeric;
  v_stock_before integer;
  v_stock_after integer;
  v_threshold integer;
  v_item_label text;
  v_lines jsonb := '[]'::jsonb;
  v_total numeric := 0;
  v_order_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to place an order.' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'This store could not be found.' USING ERRCODE = 'P0002';
  END IF;

  IF coalesce(btrim(p_customer_name), '') = '' OR length(p_customer_name) > 120 THEN
    RAISE EXCEPTION 'Please enter your name.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(btrim(p_customer_phone), '') = '' OR length(p_customer_phone) > 32 THEN
    RAISE EXCEPTION 'Please enter a valid phone number.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(btrim(p_delivery_address), '') = '' OR length(p_delivery_address) > 500 THEN
    RAISE EXCEPTION 'Please enter a delivery address.' USING ERRCODE = '22023';
  END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 1000 THEN
    RAISE EXCEPTION 'Notes are too long (1000 characters max).' USING ERRCODE = '22023';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Your cart is empty.' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    BEGIN
      v_qty := (v_item->>'quantity')::integer;
    EXCEPTION WHEN others THEN
      v_qty := NULL;
    END;
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 999 THEN
      RAISE EXCEPTION 'Invalid quantity in cart.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_product FROM public.products
      WHERE id = (v_item->>'product_id')::uuid AND business_id = p_business_id
      FOR UPDATE;
    IF NOT FOUND OR NOT coalesce(v_product.is_available, false) THEN
      RAISE EXCEPTION 'An item in your cart is no longer available.' USING ERRCODE = 'P0002';
    END IF;

    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_variant_label := NULL;
    v_item_label := v_product.name;

    IF v_product.has_variants AND v_variant_id IS NULL THEN
      RAISE EXCEPTION 'Please choose a size or color for %.', v_product.name USING ERRCODE = '22023';
    END IF;

    -- ---- stock ----
    IF v_variant_id IS NOT NULL THEN
      SELECT * INTO v_variant FROM public.product_variants
        WHERE id = v_variant_id AND product_id = v_product.id
        FOR UPDATE;
      IF NOT FOUND OR NOT v_variant.is_available THEN
        RAISE EXCEPTION 'The option you chose for % is no longer available.', v_product.name USING ERRCODE = 'P0002';
      END IF;
      v_variant_label := nullif(concat_ws(' / ', nullif(v_variant.color, ''), nullif(v_variant.size, '')), '');
      IF v_variant_label IS NOT NULL THEN
        v_item_label := v_product.name || ' (' || v_variant_label || ')';
      END IF;

      v_stock_before := v_variant.stock_quantity;
      IF v_stock_before < v_qty THEN
        IF v_stock_before <= 0 THEN
          RAISE EXCEPTION '% is sold out.', v_item_label USING ERRCODE = '23514';
        END IF;
        RAISE EXCEPTION 'Only % left of %.', v_stock_before, v_item_label USING ERRCODE = '23514';
      END IF;
      v_stock_after := v_stock_before - v_qty;
      UPDATE public.product_variants SET stock_quantity = v_stock_after, updated_at = now() WHERE id = v_variant.id;
      v_threshold := coalesce(v_variant.low_stock_threshold, v_product.low_stock_threshold, 5);
    ELSIF coalesce(v_product.track_inventory, false) AND v_product.stock_quantity IS NOT NULL THEN
      v_stock_before := v_product.stock_quantity;
      IF v_stock_before < v_qty THEN
        IF v_stock_before <= 0 THEN
          RAISE EXCEPTION '% is sold out.', v_item_label USING ERRCODE = '23514';
        END IF;
        RAISE EXCEPTION 'Only % left of %.', v_stock_before, v_item_label USING ERRCODE = '23514';
      END IF;
      v_stock_after := v_stock_before - v_qty;
      UPDATE public.products SET stock_quantity = v_stock_after, updated_at = now() WHERE id = v_product.id;
      v_threshold := coalesce(v_product.low_stock_threshold, 5);
    ELSE
      v_stock_before := NULL;
    END IF;

    -- Low/out-of-stock alert, fired once per threshold crossing (same
    -- rule as lib/inventory-notifications.ts).
    IF v_stock_before IS NOT NULL THEN
      IF v_stock_before > 0 AND v_stock_after = 0 THEN
        INSERT INTO public.notifications (business_id, type, title, body, data)
        VALUES (p_business_id, 'out_of_stock', 'Out of stock', v_item_label || ' just sold out.',
          jsonb_build_object('productId', v_product.id, 'variantId', v_variant_id, 'productName', v_product.name,
                             'variantLabel', v_variant_label, 'remaining', 0));
      ELSIF v_stock_before > v_threshold AND v_stock_after <= v_threshold AND v_stock_after > 0 THEN
        INSERT INTO public.notifications (business_id, type, title, body, data)
        VALUES (p_business_id, 'low_stock', 'Running low', 'Only ' || v_stock_after || ' left of ' || v_item_label || '.',
          jsonb_build_object('productId', v_product.id, 'variantId', v_variant_id, 'productName', v_product.name,
                             'variantLabel', v_variant_label, 'remaining', v_stock_after));
      END IF;
    END IF;

    -- ---- price: best active promotion, same rules as lib/promotions.ts ----
    v_base := round(v_product.price, 2);
    v_price := v_base;
    v_badge := NULL;
    FOR v_promo IN
      SELECT pr.discount_type, pr.discount_value
      FROM public.promotions pr
      WHERE pr.business_id = p_business_id
        AND pr.is_active = true
        AND pr.start_date <= now()
        AND pr.end_date > now()
        AND pr.discount_value > 0
        AND (
          pr.applies_to = 'all'
          OR EXISTS (SELECT 1 FROM public.promotion_products pp
                     WHERE pp.promotion_id = pr.id AND pp.product_id = v_product.id)
        )
    LOOP
      IF v_promo.discount_type = 'fixed' THEN
        v_candidate := greatest(0, v_base - v_promo.discount_value);
      ELSE
        v_candidate := greatest(0, v_base * (1 - least(100, greatest(0, v_promo.discount_value)) / 100));
      END IF;
      v_candidate := round(v_candidate, 2);
      IF v_candidate < v_price THEN
        v_price := v_candidate;
        v_badge := CASE WHEN v_promo.discount_type = 'fixed'
          THEN '$' || to_char(v_promo.discount_value, 'FM999999990.00') || ' OFF'
          ELSE trim_scale(least(100, v_promo.discount_value))::text || '% OFF'
        END;
      END IF;
    END LOOP;

    v_total := v_total + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'price', v_price,
      'quantity', v_qty,
      'image_url', v_product.image_url,
      'variant_id', v_variant_id,
      'variant_label', v_variant_label,
      'original_price', CASE WHEN v_price < v_base THEN v_base END,
      'promotion_badge', v_badge
    );
  END LOOP;

  INSERT INTO public.orders (
    business_id, customer_id, customer_name, customer_email, customer_phone,
    total_amount, status, order_items, delivery_address, additional_notes, inquiry_type
  ) VALUES (
    p_business_id, v_uid, btrim(p_customer_name), auth.jwt()->>'email', btrim(p_customer_phone),
    round(v_total, 2), 'pending', v_lines, btrim(p_delivery_address), nullif(btrim(p_notes), ''), 'order'
  )
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('order_id', v_order_id, 'total_amount', round(v_total, 2), 'items', v_lines);
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(uuid, jsonb, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, jsonb, text, text, text, text) TO authenticated;

-- ------------------------------------------------------------
-- 2. Business notifications: owners may insert their own
-- ------------------------------------------------------------
-- (The open "Anyone can insert notifications" policy is dropped in 024.)
DROP POLICY IF EXISTS "Business owners can insert their notifications" ON public.notifications;
CREATE POLICY "Business owners can insert their notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 3. Customer notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_user_created
  ON public.customer_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_user_unread
  ON public.customer_notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their notifications" ON public.customer_notifications;
CREATE POLICY "Customers can view their notifications" ON public.customer_notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can mark their notifications read" ON public.customer_notifications;
CREATE POLICY "Customers can mark their notifications read" ON public.customer_notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Only read_at may change from the client; rows are created by triggers.
REVOKE INSERT, UPDATE, DELETE ON public.customer_notifications FROM anon, authenticated;
GRANT SELECT ON public.customer_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.customer_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_customer_of_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store text;
  v_ref text := '#' || left(NEW.id::text, 8);
  v_title text;
  v_body text;
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT business_name INTO v_store FROM public.businesses WHERE id = NEW.business_id;
  v_store := coalesce(v_store, 'The store');

  IF TG_OP = 'INSERT' THEN
    v_title := 'Order placed';
    v_body := 'Your order ' || v_ref || ' with ' || v_store || ' was received.';
  ELSE
    CASE NEW.status
      WHEN 'confirmed' THEN
        v_title := 'Order confirmed';
        v_body := v_store || ' confirmed your order ' || v_ref || '.';
      WHEN 'completed' THEN
        v_title := 'Order completed';
        v_body := 'Your order ' || v_ref || ' from ' || v_store || ' is complete.';
      WHEN 'cancelled' THEN
        v_title := 'Order cancelled';
        v_body := v_store || ' cancelled your order ' || v_ref || '.';
      ELSE
        v_title := 'Order updated';
        v_body := 'Your order ' || v_ref || ' with ' || v_store || ' is now ' || replace(coalesce(NEW.status, 'updated'), '_', ' ') || '.';
    END CASE;
  END IF;

  INSERT INTO public.customer_notifications (user_id, business_id, order_id, type, title, body)
  VALUES (NEW.customer_id, NEW.business_id, NEW.id,
          CASE WHEN TG_OP = 'INSERT' THEN 'order_placed' ELSE 'order_' || coalesce(NEW.status, 'updated') END,
          v_title, v_body);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_notify_customer ON public.orders;
CREATE TRIGGER on_order_notify_customer
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_of_order();

CREATE OR REPLACE FUNCTION public.notify_customer_of_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store text;
  v_service text;
  v_when text;
  v_title text;
  v_body text;
BEGIN
  IF NEW.customer_id IS NULL OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT business_name INTO v_store FROM public.businesses WHERE id = NEW.business_id;
  SELECT name INTO v_service FROM public.services WHERE id = NEW.service_id;
  v_store := coalesce(v_store, 'The business');
  v_service := coalesce(v_service, 'your booking');
  v_when := CASE WHEN NEW.booking_date IS NOT NULL
    THEN ' on ' || to_char(NEW.booking_date, 'Mon FMDD') ||
         coalesce(' at ' || to_char(DATE '2000-01-01' + NEW.booking_time, 'FMHH12:MI AM'), '')
    ELSE '' END;

  CASE NEW.status
    WHEN 'confirmed' THEN
      v_title := 'Booking confirmed';
      v_body := v_store || ' confirmed ' || v_service || v_when || '.';
    WHEN 'rescheduled' THEN
      v_title := 'Booking rescheduled';
      v_body := v_store || ' moved ' || v_service || v_when || '.';
    WHEN 'cancelled' THEN
      v_title := 'Booking cancelled';
      v_body := v_store || ' cancelled ' || v_service || '.';
    WHEN 'completed' THEN
      v_title := 'Booking completed';
      v_body := v_service || ' with ' || v_store || ' is complete.';
    ELSE
      v_title := 'Booking updated';
      v_body := v_service || ' with ' || v_store || ' is now ' || replace(coalesce(NEW.status, 'updated'), '_', ' ') || '.';
  END CASE;

  INSERT INTO public.customer_notifications (user_id, business_id, booking_id, type, title, body)
  VALUES (NEW.customer_id, NEW.business_id, NEW.id, 'booking_' || coalesce(NEW.status, 'updated'), v_title, v_body);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_notify_customer ON public.bookings;
CREATE TRIGGER on_booking_notify_customer
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_customer_of_booking();
