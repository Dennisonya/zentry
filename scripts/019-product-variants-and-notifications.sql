-- Product image gallery, size/color variants with per-variant stock, and a
-- notifications table for low-stock/out-of-stock alerts to business owners.
--
-- products.image_url and the existing stock_quantity/track_inventory/
-- low_stock_threshold columns are untouched — non-variant products keep
-- using them exactly as before. products.has_variants is an explicit flag
-- (not inferred from row existence) so a product mid-edit in "variant mode"
-- with zero saved variants yet doesn't flicker between states, and so a
-- storefront list render doesn't need an EXISTS join per product.

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text,
  color text,
  sku text,
  stock_quantity int NOT NULL DEFAULT 0,
  low_stock_threshold int, -- null = fall back to products.low_stock_threshold
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_unique_combo
  ON public.product_variants (product_id, COALESCE(size, ''), COALESCE(color, ''));
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'low_stock' | 'out_of_stock'
  title text NOT NULL,
  body text NOT NULL,
  data jsonb, -- { productId, variantId, productName, variantLabel, remaining }
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON public.notifications(business_id, created_at DESC);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage their product images" ON public.product_images
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.businesses b ON b.id = p.business_id
      WHERE b.user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can view product images for available products" ON public.product_images
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE is_available = true)
  );

CREATE POLICY "Business owners can manage their product variants" ON public.product_variants
  FOR ALL USING (
    product_id IN (
      SELECT p.id FROM public.products p
      JOIN public.businesses b ON b.id = p.business_id
      WHERE b.user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can view variants for available products" ON public.product_variants
  FOR SELECT USING (
    product_id IN (SELECT id FROM public.products WHERE is_available = true)
  );

-- Same "anyone can insert" shape as orders/page_views — checkout runs
-- entirely from the client with the anon key, so a customer's browser is
-- what triggers a low-stock notification row on the owner's behalf.
CREATE POLICY "Business owners can view their notifications" ON public.notifications
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Business owners can update their notifications" ON public.notifications
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
  );
CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
