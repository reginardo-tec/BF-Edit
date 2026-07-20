DROP POLICY IF EXISTS "Anyone views active products" ON public.products;

CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (active = true);

CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));