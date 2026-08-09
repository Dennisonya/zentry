-- Add layout and theme customization columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'classic_card';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#6366f1';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1a1a1a';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS custom_css TEXT;

