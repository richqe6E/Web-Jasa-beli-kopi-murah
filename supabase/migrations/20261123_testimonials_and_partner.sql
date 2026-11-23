-- ============================================================
-- JASDOR RISGOLD — MIGRATION: TESTIMONIALS & PARTNER SETTINGS
-- Run in Supabase SQL Editor if not applied via MCP/CLI
-- ============================================================

-- 1. Extend app_settings with partner forwarding & payment method settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS partner_name text NOT NULL DEFAULT 'Jasdor Moulii',
  ADD COLUMN IF NOT EXISTS partner_whatsapp text NOT NULL DEFAULT '6281521692248',
  ADD COLUMN IF NOT EXISTS partner_payment_methods text NOT NULL DEFAULT 'BCA / GoPay / Dana / QRIS',
  ADD COLUMN IF NOT EXISTS partner_use_admin_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_payment_methods text NOT NULL DEFAULT 'QRIS / Transfer Bank / E-Wallet (konfirmasi via Admin)';

-- 2. Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_code text NOT NULL UNIQUE,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name_masked text NOT NULL,
  brand_name text NOT NULL DEFAULT '',
  outlet_name text NOT NULL DEFAULT '',
  city_label text NOT NULL DEFAULT '',
  rating smallint NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 3 AND 500),
  photo_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_public_feed
  ON public.testimonials (created_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_testimonials_created_desc
  ON public.testimonials (created_at DESC);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS testimonials_public_read ON public.testimonials;
CREATE POLICY testimonials_public_read
  ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS testimonials_admin_select ON public.testimonials;
CREATE POLICY testimonials_admin_select
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS testimonials_admin_update ON public.testimonials;
CREATE POLICY testimonials_admin_update
  ON public.testimonials
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS testimonials_admin_delete ON public.testimonials;
CREATE POLICY testimonials_admin_delete
  ON public.testimonials
  FOR DELETE
  TO authenticated
  USING (true);

-- 3. Mask customer name helper (e.g. "Dian" -> "Di***")
CREATE OR REPLACE FUNCTION public.mask_customer_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean text;
  v_first text;
BEGIN
  v_clean := btrim(coalesce(p_name, ''));
  IF v_clean = '' THEN
    RETURN 'Pe***';
  END IF;
  v_first := split_part(v_clean, ' ', 1);
  IF char_length(v_first) <= 2 THEN
    RETURN left(v_first, 1) || '***';
  ELSIF char_length(v_first) <= 4 THEN
    RETURN left(v_first, 2) || '***';
  ELSE
    RETURN left(v_first, 3) || '***';
  END IF;
END;
$$;

-- 4. Lookup order for /review?order=... (safe subset, no phone/address)
CREATE OR REPLACE FUNCTION public.lookup_order_for_review(p_order_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_order record;
  v_existing record;
BEGIN
  v_code := upper(btrim(regexp_replace(coalesce(p_order_code, ''), '^#+', '')));
  IF v_code = '' THEN
    RETURN jsonb_build_object('found', false, 'reason', 'empty');
  END IF;

  SELECT id, order_code, customer_name, brand_name, outlet_name, outlet_area, created_at
  INTO v_order
  FROM public.orders
  WHERE upper(order_code) = v_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'order_code', v_code, 'reason', 'not_found');
  END IF;

  SELECT id, created_at, rating, message, photo_url
  INTO v_existing
  FROM public.testimonials
  WHERE upper(order_code) = upper(v_order.order_code)
  LIMIT 1;

  RETURN jsonb_build_object(
    'found', true,
    'already_reviewed', FOUND,
    'order_code', v_order.order_code,
    'customer_first_name', split_part(btrim(coalesce(v_order.customer_name, 'Pelanggan')), ' ', 1),
    'customer_name_masked', public.mask_customer_name(v_order.customer_name),
    'brand_name', coalesce(v_order.brand_name, ''),
    'outlet_name', coalesce(v_order.outlet_name, ''),
    'outlet_area', coalesce(v_order.outlet_area, ''),
    'created_at', v_order.created_at
  );
END;
$$;

-- 5. Submit verified testimonial
CREATE OR REPLACE FUNCTION public.submit_testimonial(
  p_order_code text,
  p_message text,
  p_city_label text DEFAULT '',
  p_rating smallint DEFAULT 5,
  p_photo_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_msg text;
  v_city text;
  v_rating smallint;
  v_photo text;
  v_order record;
  v_inserted public.testimonials;
BEGIN
  v_code := upper(btrim(regexp_replace(coalesce(p_order_code, ''), '^#+', '')));
  v_msg := btrim(coalesce(p_message, ''));
  v_city := left(btrim(coalesce(p_city_label, '')), 60);
  v_rating := greatest(1, least(5, coalesce(p_rating, 5)));
  v_photo := nullif(btrim(coalesce(p_photo_url, '')), '');

  IF char_length(v_msg) < 3 OR char_length(v_msg) > 500 THEN
    RAISE EXCEPTION 'Pesan ulasan harus 3 sampai 500 karakter.';
  END IF;

  IF v_photo IS NOT NULL AND v_photo NOT LIKE 'https://qfjjhnudiyybuqddwlav.supabase.co/storage/v1/object/public/testimonials/%' THEN
    RAISE EXCEPTION 'URL foto testimoni tidak valid.';
  END IF;

  SELECT id, order_code, customer_name, brand_name, outlet_name, outlet_area
  INTO v_order
  FROM public.orders
  WHERE upper(order_code) = v_code
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kode pesanan #% tidak ditemukan di sistem.', v_code;
  END IF;

  IF EXISTS (SELECT 1 FROM public.testimonials WHERE upper(order_code) = upper(v_order.order_code)) THEN
    RAISE EXCEPTION 'Pesanan #% sudah pernah memberikan ulasan.', v_order.order_code;
  END IF;

  INSERT INTO public.testimonials (
    order_code,
    order_id,
    customer_name_masked,
    brand_name,
    outlet_name,
    city_label,
    rating,
    message,
    photo_url,
    is_published
  )
  VALUES (
    v_order.order_code,
    v_order.id,
    public.mask_customer_name(v_order.customer_name),
    coalesce(v_order.brand_name, ''),
    coalesce(v_order.outlet_name, ''),
    CASE WHEN v_city <> '' THEN v_city ELSE coalesce(nullif(v_order.outlet_area, ''), v_order.outlet_name, '') END,
    v_rating,
    v_msg,
    v_photo,
    true
  )
  RETURNING * INTO v_inserted;

  RETURN to_jsonb(v_inserted);
END;
$$;

-- 6. Fast summary stats for public WA chat header
CREATE OR REPLACE FUNCTION public.get_testimonials_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_count', count(*)::int,
    'avg_rating', coalesce(round(avg(rating)::numeric, 1), 5.0)
  )
  FROM public.testimonials
  WHERE is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order_for_review(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_testimonial(text, text, text, smallint, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_testimonials_summary() TO anon, authenticated;

-- 7. Storage bucket for compressed WebP review photos (max 600 KB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonials',
  'testimonials',
  true,
  614400,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 614400,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

DROP POLICY IF EXISTS "testimonials_storage_public_read" ON storage.objects;
CREATE POLICY "testimonials_storage_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'testimonials');

DROP POLICY IF EXISTS "testimonials_storage_anon_upload" ON storage.objects;
CREATE POLICY "testimonials_storage_anon_upload"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'testimonials'
    AND name LIKE 'reviews/%'
  );

DROP POLICY IF EXISTS "testimonials_storage_admin_delete" ON storage.objects;
CREATE POLICY "testimonials_storage_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials');
