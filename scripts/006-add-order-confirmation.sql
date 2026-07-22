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

-- Allow anyone to fetch an order by confirmation token (for the public confirm page)
-- We expose only the fields needed — the RLS below allows SELECT on token match.
CREATE POLICY "Anyone can view order by confirmation token"
ON "orders"
FOR SELECT
TO PUBLIC
USING (...);
