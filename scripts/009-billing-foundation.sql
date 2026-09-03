-- ============================================================
-- Migration 009: Billing foundation
-- ============================================================
-- Establishes subscription_plan / subscription_status as real,
-- constrained columns the rest of the app can trust for feature
-- gating (custom store design, inventory management, etc.), and
-- adds the fields needed to manage subscriptions via Stripe webhooks.
--
-- Two tiers only: 'Starter' and 'Pro' (Pro unlocks the custom store
-- design builder). Casing matches lib/plans.ts exactly — PlanId is
-- "Starter" | "Pro", not lowercase, and the DB has to agree with that
-- or every feature-gating check silently falls back to Starter.
--
-- This migration does NOT wire up Stripe itself — it just makes
-- sure the data model is solid before that lands.

-- 1. Migrate any existing plan values to the new two-tier naming.
--    001-create-tables.sql originally defaulted subscription_plan to
--    the lowercase 'basic', and a since-removed 'growth' tier existed
--    briefly too — map everything explicitly rather than assuming the
--    column is already empty.
UPDATE public.businesses SET subscription_plan = 'Starter' WHERE subscription_plan = 'basic';
UPDATE public.businesses SET subscription_plan = 'Pro' WHERE subscription_plan IN ('pro', 'growth', 'enterprise', 'premium');

UPDATE public.profiles SET intended_plan = 'Starter' WHERE intended_plan = 'basic';
UPDATE public.profiles SET intended_plan = 'Pro' WHERE intended_plan IN ('pro', 'growth', 'premium');

-- 2. Fields needed to manage subscriptions via Stripe webhooks.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer_id ON public.businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription_id ON public.businesses(stripe_subscription_id);

-- 3. Enforce valid plan/status values so the app (and Postgres triggers)
--    can trust these columns instead of treating them as free text.
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_subscription_plan_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_subscription_plan_check
  CHECK (subscription_plan IN ('Starter', 'Pro'));

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_subscription_status_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'incomplete'));

ALTER TABLE public.businesses ALTER COLUMN subscription_plan SET DEFAULT 'Starter';
ALTER TABLE public.businesses ALTER COLUMN subscription_status SET DEFAULT 'trial';

-- 4. Align profiles.intended_plan (captured at signup, before a business
--    row exists) with the same two tiers.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_intended_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_intended_plan_check
  CHECK (intended_plan IS NULL OR intended_plan IN ('Starter', 'Pro'));

-- 5. Update the signup trigger function to match the new plan names.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acct_type TEXT;
  plan TEXT;
  view_default TEXT;
BEGIN
  acct_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal');
  plan := NEW.raw_user_meta_data->>'intended_plan';
  view_default := CASE WHEN acct_type = 'business' THEN 'business' ELSE 'personal' END;

  IF plan IS NOT NULL AND plan NOT IN ('Starter', 'Pro') THEN
    plan := NULL;
  END IF;

  INSERT INTO public.profiles (id, default_view, intended_plan)
  VALUES (NEW.id, view_default, plan)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. Defense-in-depth hook for plan changes.
--    Whenever subscription_plan or subscription_status changes — whether
--    from a future Stripe webhook, an admin edit, or anything else — this
--    trigger fires. It's a no-op today because no plan-gated columns exist
--    yet. When the custom store design builder's page_schema column lands
--    (Pro-tier feature), its downgrade cleanup logic gets added to this
--    function body, not a new trigger — so it's guaranteed to run no
--    matter how the plan change happens, instead of depending on
--    application code to remember to call it.
CREATE OR REPLACE FUNCTION public.handle_subscription_downgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No plan-gated columns exist yet — placeholder for future cleanup logic.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_change ON public.businesses;
CREATE TRIGGER on_subscription_change
  AFTER UPDATE OF subscription_plan, subscription_status ON public.businesses
  FOR EACH ROW
  WHEN (
    OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan
    OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
  )
  EXECUTE FUNCTION public.handle_subscription_downgrade();
