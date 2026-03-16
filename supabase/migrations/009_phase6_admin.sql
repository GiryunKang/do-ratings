-- Phase 6: Admin & Business

-- 1. Business claims (businesses claiming their subject pages)
CREATE TABLE public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_id)
);

CREATE INDEX idx_business_claims_status ON public.business_claims(verification_status);
CREATE INDEX idx_business_claims_user ON public.business_claims(user_id);

ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved claims" ON public.business_claims FOR SELECT USING (verification_status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Auth users can submit claims" ON public.business_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending claims" ON public.business_claims FOR UPDATE USING (auth.uid() = user_id AND verification_status = 'pending');

-- 2. Business responses (verified business owners responding to reviews)
CREATE TABLE public.business_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view responses" ON public.business_responses FOR SELECT USING (true);
CREATE POLICY "Verified business owners can respond" ON public.business_responses FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.business_claims bc
    JOIN public.reviews r ON r.subject_id = bc.subject_id
    WHERE r.id = review_id AND bc.user_id = auth.uid() AND bc.verification_status = 'approved'
  )
);

-- 3. Admin role flag on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Update public_profiles view
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = false) AS
  SELECT id, nickname, avatar_url, level, review_count, total_helpful_count, trust_score, is_admin, created_at
  FROM public.users;
