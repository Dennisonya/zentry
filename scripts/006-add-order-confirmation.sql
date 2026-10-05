-- ============================================================
-- Migration 006: QR-based order confirmation system
-- ============================================================

-- Add confirmation + OTP columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS otp_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Backfill existing orders with a unique confirmation token
UPDATE orders
SET confirmation_token = gen_random_uuid()::TEXT
WHERE confirmation_token IS NULL;

-- Index for fast lookup by token (used on the confirm-order page)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_confirmation_token ON orders(confirmation_token);

-- The public confirm page does not read orders through a table policy.
-- A "SELECT by token" policy can't check that the caller actually knows
-- the token, so lookups go through the get_order_by_confirmation_token()
-- RPC instead (scripts/016, narrowed in scripts/020).
