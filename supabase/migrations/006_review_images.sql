-- Review images table for photo gallery feature
CREATE TABLE public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_images_review ON public.review_images(review_id);
CREATE INDEX idx_review_images_user ON public.review_images(user_id);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review images"
  ON public.review_images FOR SELECT USING (true);

CREATE POLICY "Users can insert own review images"
  ON public.review_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review images"
  ON public.review_images FOR DELETE
  USING (auth.uid() = user_id);
