-- Add business_type_mode field to businesses table to distinguish products from services
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS business_type_mode TEXT DEFAULT 'product';

-- Update existing businesses to have product type by default
UPDATE businesses SET business_type_mode = 'product' WHERE business_type_mode IS NULL;

-- Create index for business_type_mode
CREATE INDEX IF NOT EXISTS idx_businesses_business_type_mode ON businesses(business_type_mode);

