-- ============================================================
-- Migration 020: Lock down order confirmation
-- ============================================================
-- Follow-up to 016. Run 016 first (it adds otp_code_hash / otp_attempts
-- and the three RPCs); this migration then:
--
--   1. Narrows get_order_by_confirmation_token() to the fields the public
--      confirm page actually shows. The 016 version returned the whole row,
--      including otp_code_hash — a bcrypt hash of a 6-digit number can be
--      brute-forced offline in seconds, which would bypass the attempt
--      limit entirely. It also hid delivery_code until the order is
--      confirmed.
--   2. Fixes verify_order_confirmation_code()'s attempt counter. In 016 a
--      wrong code did `UPDATE ... otp_attempts + 1` and then RAISE — the
--      exception rolls the increment back, so the 5-attempt lockout never
--      triggered. A wrong code now returns false (committing the
--      increment) instead of raising.
--   3. Generates codes with gen_random_bytes() instead of random().
--   4. Drops the "Customers can confirm orders via token" UPDATE policy,
--      whose USING clause (confirmation_token IS NOT NULL) let anyone
--      update any order. Customers now confirm only through the RPCs
--      above; business owners keep their own UPDATE policy.
--
-- Deploy order: ship the frontend that calls these RPCs together with
-- (or right after) this migration — the old frontend's direct updates
-- will be rejected once the policy is gone.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A random 6-digit code from a cryptographically secure source.
CREATE OR REPLACE FUNCTION public.random_six_digit_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT lpad(((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint % 1000000))::text, 6, '0');
$$;

-- ------------------------------------------------------------
-- 1. Public order lookup — only what the confirm page renders.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_order_by_confirmation_token(text);

CREATE FUNCTION public.get_order_by_confirmation_token(p_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'total_amount', o.total_amount,
    'status', o.status,
    'order_items', o.order_items,
    'created_at', o.created_at,
    'confirmed_at', o.confirmed_at,
    'delivery_code', CASE WHEN o.confirmed_at IS NOT NULL THEN o.delivery_code END
  )
  FROM public.orders o
  WHERE p_token IS NOT NULL AND o.confirmation_token = p_token;
$$;

-- ------------------------------------------------------------
-- 2. Request a code (same contract as 016, secure randomness).
-- ------------------------------------------------------------
-- Still returns the code to the caller because there is no SMS/WhatsApp
-- channel yet; once there is, send it from here and stop returning it.
CREATE OR REPLACE FUNCTION public.request_order_confirmation_code(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders;
  v_code text;
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

  v_code := public.random_six_digit_code();

  UPDATE public.orders
  SET
    otp_code_hash = crypt(v_code, gen_salt('bf')),
    otp_expires_at = now() + interval '5 minutes',
    otp_attempts = 0,
    delivery_code = COALESCE(v_order.delivery_code, public.random_six_digit_code())
  WHERE id = v_order.id;

  RETURN jsonb_build_object('code', v_code, 'expires_in_seconds', 300);
END;
$$;

-- ------------------------------------------------------------
-- 3. Verify a code and complete the order.
-- ------------------------------------------------------------
-- Returns the delivery code on success, NULL on a wrong code (after
-- counting the attempt), and raises for every other failure.
DROP FUNCTION IF EXISTS public.verify_order_confirmation_code(text, text);

CREATE FUNCTION public.verify_order_confirmation_code(p_token text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders;
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
  IF v_order.otp_code_hash IS NULL OR v_order.otp_expires_at IS NULL THEN
    RAISE EXCEPTION 'No active code. Please request a new one';
  END IF;
  IF v_order.otp_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many incorrect attempts. Please request a new code';
  END IF;
  IF v_order.otp_expires_at < now() THEN
    RAISE EXCEPTION 'This code has expired. Please request a new one';
  END IF;

  IF p_code IS NULL OR crypt(p_code, v_order.otp_code_hash) <> v_order.otp_code_hash THEN
    UPDATE public.orders SET otp_attempts = otp_attempts + 1 WHERE id = v_order.id;
    RETURN jsonb_build_object('ok', false, 'attempts_left', greatest(0, 4 - v_order.otp_attempts));
  END IF;

  UPDATE public.orders
  SET
    status = 'completed',
    confirmed_at = now(),
    otp_code_hash = NULL,
    otp_expires_at = NULL,
    otp_attempts = 0
  WHERE id = v_order.id;

  RETURN jsonb_build_object('ok', true, 'confirmed_at', now(), 'delivery_code', v_order.delivery_code);
END;
$$;

REVOKE ALL ON FUNCTION public.random_six_digit_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_by_confirmation_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_order_confirmation_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_order_confirmation_code(text, text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 4. Close the hole: no more direct customer updates.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can confirm orders via token" ON public.orders;
