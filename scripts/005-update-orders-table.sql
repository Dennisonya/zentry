-- Add new columns to orders table for enhanced functionality
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS additional_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_datetime TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inquiry_type TEXT DEFAULT 'order';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_inquiry_type ON orders(inquiry_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Update orders table to track inquiry vs order
UPDATE orders SET inquiry_type = 
  CASE 
    WHEN status = 'inquiry' THEN 'inquiry'
    ELSE 'order'
  END
WHERE inquiry_type IS NULL;