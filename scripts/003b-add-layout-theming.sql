-- Add layout and theming fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'classic-card',
ADD COLUMN IF NOT EXISTS accent_color TEXT,
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN DEFAULT false;

-- Add index for layout_style
CREATE INDEX IF NOT EXISTS idx_businesses_layout_style ON businesses(layout_style);

