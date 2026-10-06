-- ============================================================
-- Migration 026: record objects that were created in the Supabase
-- dashboard and never written to a script
-- ============================================================
-- Already on the live project (puxdgczttpjrichdvzyj); running this there
-- changes nothing. It exists so a fresh database built from scripts/
-- matches production.

-- ------------------------------------------------------------
-- email_exists(): used by app/auth/sign-up/page.tsx to tell a visitor
-- that an email already has an account before calling signUp().
-- Copied verbatim from production (2026-10-05). It returns only a
-- boolean, but anyone can call it, so it does reveal whether an email is
-- registered.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(check_email)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.email_exists(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- "Customers can confirm orders via token" (orders, UPDATE) is NOT
-- recreated here on purpose. It was added in the dashboard as
--
--   CREATE POLICY "Customers can confirm orders via token" ON public.orders
--     FOR UPDATE USING (confirmation_token IS NOT NULL);
--
-- which let anyone update any order that had a token. scripts/016 added
-- the RPC replacement and scripts/020 drops the policy; it is no longer
-- on the live project.
-- ------------------------------------------------------------
