-- ============================================================
-- Migration 016: RPC-gated order confirmation
-- ============================================================
-- Closes the gap found in the "Customers can confirm orders via token"
-- policy: its USING clause only checks that a row HAS a token
-- (confirmation_token IS NOT NULL), not that the caller actually
-- SUPPLIED the matching one. Combined with how the OTP is currently
-- verified entirely client-side in app/confirm-order/page.tsx (compared
-- against an in-memory ref, never re-checked by the database), the real
-- guarantee today is: none. Anyone who can reach the Supabase REST API
-- directly can mark any order "completed" without ever knowing its real
-- code.
--
-- This migration ADDS the secure replacement path (SECURITY DEFINER RPCs
-- that validate the token and code themselves, independent of RLS). It
-- deliberately does NOT drop the vulnerable policy yet — see the note at
-- the bottom for why, and what has to happen before that's safe.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- otp_code stays as-is (still read by the current frontend) but is no
-- longer what these new functions trust — otp_code_hash is. Once the
-- frontend is migrated to the RPCs below, otp_code becomes unused and
-- can be dropped in a later cleanup migration.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS otp_code_hash text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0;

-- ------------------------------------------------------------
-- 1. Look up an order by its confirmation token.
-- ------------------------------------------------------------
-- Replaces the frontend's direct `.select("*").eq("confirmation_token",
-- token)` call, which — worth noting separately from the security fix —
-- doesn't reliably work for a true anonymous guest today either, since
-- there's no SELECT policy on orders that permits lookup by token; only
-- "own orders by customer_id" and "own orders by business ownership."
-- This function fixes both the security gap and that read gap at once.
CREATE OR REPLACE FUNCTION public.get_order_by_confirmation_token(p_token text)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.orders WHERE confirmation_token = p_token;
$$;

-- ------------------------------------------------------------
-- 2. Request a confirmation code for an order.
-- ------------------------------------------------------------
-- Generates a 6-digit code, stores only its hash, and returns the plain
-- code to the caller for display. Note: since this app doesn't yet send
-- the code over a separate channel (SMS/WhatsApp — currently just
-- console.logged as a placeholder), returning it here means the token
-- link is still the only real proof of identity, same as today. Once
-- real out-of-band delivery is wired up, this function should stop
-- returning the code in its response and send it instead — otherwise the
-- OTP step isn't actually a second factor, just a UI step.
CREATE OR REPLACE FUNCTION public.request_order_confirmation_code(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_code text;
  v_delivery_code text;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE confirmation_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.status = 'completed' OR v_order.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order has already been confirmed';
  END IF;
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'This order has been cancelled';
  END IF;

  v_code := lpad((floor(random() * 1000000))::text, 6, '0');
  v_delivery_code := COALESCE(v_order.delivery_code, lpad((floor(random() * 1000000))::text, 6, '0'));

  UPDATE public.orders
  SET
    otp_code_hash = crypt(v_code, gen_salt('bf')),
    otp_expires_at = now() + interval '5 minutes',
    otp_attempts = 0,
    delivery_code = v_delivery_code
  WHERE id = v_order.id;

  RETURN jsonb_build_object('code', v_code, 'delivery_code', v_delivery_code, 'expires_in_seconds', 300);
END;
$$;

-- ------------------------------------------------------------
-- 3. Verify a confirmation code and mark the order completed.
-- ------------------------------------------------------------
-- This is the function that actually replaces the vulnerable UPDATE —
-- the frontend should call this instead of writing to orders directly.
-- Locks out further attempts after 5 wrong guesses on one requested code
-- (matches the design doc's "check attempts" step); requesting a new
-- code via function #2 resets the counter.
CREATE OR REPLACE FUNCTION public.verify_order_confirmation_code(p_token text, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE confirmation_token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.status = 'completed' OR v_order.confirmed_at IS NOT NULL THEN
    RAISE EXCEPTION 'This order has already been confirmed';
  END IF;
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'This order has been cancelled';
  END IF;
  IF v_order.otp_code_hash IS NULL OR v_order.otp_expires_at IS NULL THEN
    RAISE EXCEPTION 'No active code — request a new one';
  END IF;
  IF v_order.otp_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many incorrect attempts — request a new code';
  END IF;
  IF v_order.otp_expires_at < now() THEN
    RAISE EXCEPTION 'This code has expired — request a new one';
  END IF;

  IF crypt(p_code, v_order.otp_code_hash) != v_order.otp_code_hash THEN
    UPDATE public.orders SET otp_attempts = otp_attempts + 1 WHERE id = v_order.id;
    RAISE EXCEPTION 'Incorrect code';
  END IF;

  UPDATE public.orders
  SET
    status = 'completed',
    confirmed_at = now(),
    otp_code_hash = NULL,
    otp_expires_at = NULL,
    otp_attempts = 0
  WHERE id = v_order.id;

  RETURN true;
END;
$$;

-- ------------------------------------------------------------
-- IMPORTANT — the vulnerable policy is NOT dropped by this migration.
-- ------------------------------------------------------------
-- app/confirm-order/page.tsx still does a direct `.update({status:
-- "completed", ...})` today. If the policy below were dropped now, order
-- confirmation would break immediately for every guest, before the
-- frontend has been switched to call verify_order_confirmation_code()
-- instead. That frontend change needs to ship first (and get tested),
-- THEN this policy should be dropped in a small follow-up migration:
--
--   DROP POLICY "Customers can confirm orders via token" ON public.orders;
--
-- Until that follow-up runs, the gap described at the top of this file
-- is still open — this migration adds the fix, it doesn't flip it on by
-- itself.
