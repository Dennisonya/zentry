-- Promotion targets for services (pairs with promotion_products for products)
CREATE TABLE IF NOT EXISTS public.promotion_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(promotion_id, service_id)
);

ALTER TABLE public.promotion_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage promotion services" ON public.promotion_services
  FOR ALL USING (
    promotion_id IN (
      SELECT id FROM promotions WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_promotion_services_promotion_id ON public.promotion_services(promotion_id);
