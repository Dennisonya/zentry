-- ============================================================
-- Migration 021: Deliver confirmation codes by SMS / WhatsApp
-- ============================================================
-- Until now request_order_confirmation_code() handed the plain code back
-- to the browser, so the code proved nothing beyond having the link.
-- From here on only the send-order-confirmation-code Edge Function
-- (supabase/functions/send-order-confirmation-code) may call it: the
-- function generates the code here, texts it to the customer's phone, and
-- never returns it to the browser.
--
-- Also adds send limits, since every request now costs an SMS/WhatsApp
-- message and could be used to spam the customer's phone:
--   * at most one code per minute per order
--   * at most 5 codes per hour per order
--
-- Deploy order: deploy the Edge Function (with its Twilio secrets) and the
-- frontend that calls it, then run this. Once this runs, the browser can
-- no longer request codes directly.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS otp_sent_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS otp_send_window_started_at timestamptz;

CREATE OR REPLACE FUNCTION public.request_order_confirmation_code(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders;
  v_code text;
  v_window_start timestamptz;
  v_sent_count integer;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE confirmation_token = p_token FOR UPDATE;

  IF p_token IS NULL OR NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.status = 'completed' OR v_order.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order has already been confirmed';
  END IF;
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'This order has been cancelled';
  END IF;
  IF v_order.customer_phone IS NULL OR btrim(v_order.customer_phone) = '' THEN
    RAISE EXCEPTION 'This order has no phone number. Please contact the business';
  END IF;

  -- Codes live 5 minutes, so an expiry more than 4 minutes away means the
  -- last one went out less than a minute ago.
  IF v_order.otp_expires_at IS NOT NULL AND v_order.otp_expires_at > now() + interval '4 minutes' THEN
    RAISE EXCEPTION 'Please wait a minute before requesting another code';
  END IF;

  IF v_order.otp_send_window_started_at IS NULL OR v_order.otp_send_window_started_at < now() - interval '1 hour' THEN
    v_window_start := now();
    v_sent_count := 0;
  ELSE
    v_window_start := v_order.otp_send_window_started_at;
    v_sent_count := v_order.otp_sent_count;
  END IF;
  IF v_sent_count >= 5 THEN
    RAISE EXCEPTION 'Too many codes requested. Please try again in an hour';
  END IF;

  v_code := public.random_six_digit_code();

  UPDATE public.orders
  SET
    otp_code_hash = crypt(v_code, gen_salt('bf')),
    otp_expires_at = now() + interval '5 minutes',
    otp_attempts = 0,
    otp_sent_count = v_sent_count + 1,
    otp_send_window_started_at = v_window_start,
    delivery_code = COALESCE(v_order.delivery_code, public.random_six_digit_code())
  WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'code', v_code,
    'expires_in_seconds', 300,
    'customer_phone', v_order.customer_phone,
    'business_name', (SELECT b.business_name FROM public.businesses b WHERE b.id = v_order.business_id)
  );
END;
$$;

-- Only the Edge Function (service role) may issue codes.
REVOKE ALL ON FUNCTION public.request_order_confirmation_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_order_confirmation_code(text) TO service_role;

-- The plain-text otp_code column from 006 is no longer written by anything.
UPDATE public.orders SET otp_code = NULL WHERE otp_code IS NOT NULL;
