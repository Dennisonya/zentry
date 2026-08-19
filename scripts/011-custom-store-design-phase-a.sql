-- ============================================================
-- Migration 011: Custom store design — Phase A (data model)
-- ============================================================
-- Adds the storage for the Pro-tier drag-and-drop storefront builder,
-- plus two triggers that make plan enforcement real at the database
-- level (not just in the React UI, since the app writes to Supabase
-- straight from the browser with no API layer in between).
--
-- No block registry, renderer, or builder UI yet — this is just the
-- foundation, testable by hand-writing JSON into page_schema in
-- Supabase before any of that exists.

-- 1. Storage for the custom design.
--    page_schema        = LIVE. What customers see on the storefront.
--                          NULL means "still on a stock template"
--                          (every Starter business, and any Pro business
--                          that hasn't touched the builder yet).
--    page_schema_draft   = WORKING COPY. What the builder edits.
--                          Nothing goes live until Publish copies this
--                          into page_schema.
--    page_schema_updated_at = set by the app whenever page_schema_draft
--                          is saved, so the builder UI can show
--                          "last edited ...".
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS page_schema JSONB;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS page_schema_draft JSONB;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS page_schema_updated_at TIMESTAMPTZ;

-- 2. Give the downgrade trigger (created as a no-op placeholder in
--    migration 009) its real body: if a business isn't Pro on an
--    active/trial subscription, wipe both the live and draft custom
--    design so it falls back to the stock template layout_style
--    already renders. Runs no matter how the plan change happens
--    (future Stripe webhook, a manual edit, anything).
--
--    This is an AFTER trigger, so it can't just mutate NEW to affect
--    the row — it issues a follow-up UPDATE instead. That follow-up
--    only touches page_schema/page_schema_draft, never
--    subscription_plan/subscription_status, so it does not re-fire
--    this same trigger (which only fires ON UPDATE OF those two
--    columns) and there's no risk of a loop.
CREATE OR REPLACE FUNCTION public.handle_subscription_downgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (NEW.subscription_plan = 'Pro' AND NEW.subscription_status IN ('active', 'trial')) THEN
    UPDATE public.businesses
    SET page_schema = NULL,
        page_schema_draft = NULL,
        page_schema_updated_at = NULL
    WHERE id = NEW.id
      AND (page_schema IS NOT NULL OR page_schema_draft IS NOT NULL);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Guard trigger: reject any write that would set page_schema or
--    page_schema_draft to a non-NULL value unless the business is
--    currently Pro on an active/trial subscription. Clearing to NULL
--    is always allowed (that's exactly what the downgrade trigger
--    above does), so a downgrade can never be blocked by this guard —
--    only an attempt to *set* a custom design without the right plan
--    gets rejected.
CREATE OR REPLACE FUNCTION public.guard_page_schema_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.page_schema IS NOT NULL OR NEW.page_schema_draft IS NOT NULL)
     AND NOT (NEW.subscription_plan = 'Pro' AND NEW.subscription_status IN ('active', 'trial')) THEN
    RAISE EXCEPTION 'Custom store design requires an active Pro subscription';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_page_schema_writes ON public.businesses;
CREATE TRIGGER guard_page_schema_writes
  BEFORE INSERT OR UPDATE OF page_schema, page_schema_draft ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_page_schema_writes();
