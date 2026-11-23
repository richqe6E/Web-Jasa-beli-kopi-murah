-- ============================================================
-- JASDOR RISGOLD — OPTIONAL DATABASE SECURITY HARDENING
-- Fixes Supabase Security Advisor lints & tightens RLS checks
-- ============================================================

-- 1. Lock search_path on mask_customer_name (fixes Advisor 0011_function_search_path_mutable)
ALTER FUNCTION public.mask_customer_name(text) SET search_path = '';

-- 2. Tighten testimonials admin policies to explicitly verify authenticated UID
DROP POLICY IF EXISTS testimonials_admin_select ON public.testimonials;
CREATE POLICY testimonials_admin_select
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS testimonials_admin_update ON public.testimonials;
CREATE POLICY testimonials_admin_update
  ON public.testimonials
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS testimonials_admin_delete ON public.testimonials;
CREATE POLICY testimonials_admin_delete
  ON public.testimonials
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- 3. Tighten testimonials storage admin delete policy
DROP POLICY IF EXISTS "testimonials_storage_admin_delete" ON storage.objects;
CREATE POLICY "testimonials_storage_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials' AND (SELECT auth.uid()) IS NOT NULL);
