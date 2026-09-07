-- ============================================================
-- Migration 018: Storefront font selection
-- ============================================================
-- Adds font_family to businesses, mirroring how accent_color already
-- works: a single column, applied by the block renderer, edited from
-- Settings. Deliberately a free-text column rather than a Postgres enum
-- (matches this project's existing convention — see subscription_plan,
-- subscription_status — of TEXT + application-level validation instead
-- of DB-level enums, which are more rigid to extend later). The actual
-- set of allowed values is enforced in code (lib/storefront-fonts.ts),
-- not the database — same trust boundary as accent_color, which is also
-- free text validated client-side.

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'inter';
