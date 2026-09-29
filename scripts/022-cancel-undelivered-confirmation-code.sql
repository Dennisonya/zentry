-- ============================================================
-- Migration 022: Don't count failed SMS sends against the limits
-- ============================================================
-- request_order_confirmation_code() (021) records a send before the Edge
-- Function hands the code to Twilio. When Twilio rejects it, the customer
-- got nothing but was still locked out for a minute and charged one of
-- their five hourly sends. The Edge Function now calls this to undo that.

CREATE OR REPLACE FUNCTION public.cancel_undelivered_confirmation_code(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.orders
  SET
    otp_code_hash = NULL,
    otp_expires_at = NULL,
    otp_sent_count = greatest(otp_sent_count - 1, 0)
  WHERE confirmation_token = p_token
    AND confirmed_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.cancel_undelivered_confirmation_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_undelivered_confirmation_code(text) TO service_role;
