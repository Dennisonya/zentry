-- ============================================================
-- Migration 005: Promotions, inventory tracking, booking status
-- ============================================================

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all', -- 'all' | 'specific'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for promotions applied to specific products
CREATE TABLE IF NOT EXISTS promotion_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(promotion_id, product_id)
);

-- Add inventory tracking fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Add a notes / internal memo field to orders for business owner use
ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_notes TEXT;

-- Add customer reference to orders so business can track repeat customers
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions
CREATE POLICY "Business owners can manage their promotions" ON promotions
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view active promotions" ON promotions
  FOR SELECT USING (is_active = true AND end_date > NOW());

-- RLS Policies for promotion_products
CREATE POLICY "Business owners can manage promotion products" ON promotion_products
  FOR ALL USING (
    promotion_id IN (
      SELECT id FROM promotions WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotions_business_id ON promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion_id ON promotion_products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
