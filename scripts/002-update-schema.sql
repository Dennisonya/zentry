-- Add order_method column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS order_method TEXT DEFAULT 'whatsapp';

-- Add initial_products column to store products during onboarding
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS initial_products JSONB;

-- Update RLS policy to allow public viewing of all businesses for marketplace
CREATE POLICY IF NOT EXISTS "Anyone can view all businesses for marketplace" ON businesses
  FOR SELECT USING (true);
