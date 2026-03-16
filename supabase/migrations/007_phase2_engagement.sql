-- Phase 2: Engagement & Gamification

-- 1. Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL,
  description JSONB NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  condition_type TEXT NOT NULL CHECK (condition_type IN ('review_count','helpful_count','category_count')),
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "System inserts user achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);

-- 2. Trust score column on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0;

-- 3. Review comments table
CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_comments_review ON public.review_comments(review_id);

ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.review_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert comments" ON public.review_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.review_comments FOR DELETE USING (auth.uid() = user_id);

-- 4. Review reactions table
CREATE TABLE public.review_reactions (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like','love','wow','sad','angry')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE INDEX idx_review_reactions_review ON public.review_reactions(review_id);

ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.review_reactions FOR SELECT USING (true);
CREATE POLICY "Auth users can insert reactions" ON public.review_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.review_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.review_reactions FOR DELETE USING (auth.uid() = user_id);

-- 5. Trust score computation function
CREATE OR REPLACE FUNCTION public.compute_trust_score(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_review_count INTEGER;
  v_helpful_count INTEGER;
  v_age_days INTEGER;
  v_level TEXT;
  v_level_bonus INTEGER;
  v_score INTEGER;
BEGIN
  SELECT review_count, total_helpful_count, level,
         EXTRACT(DAY FROM now() - created_at)::INTEGER
  INTO v_review_count, v_helpful_count, v_level, v_age_days
  FROM public.users WHERE id = p_user_id;

  v_level_bonus := CASE v_level
    WHEN 'platinum' THEN 30
    WHEN 'gold' THEN 15
    WHEN 'silver' THEN 5
    ELSE 0
  END;

  v_score := LEAST(100,
    (v_review_count * 2) +
    (v_helpful_count * 3) +
    (v_age_days / 10) +
    v_level_bonus
  );

  UPDATE public.users SET trust_score = v_score WHERE id = p_user_id;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Achievement check function
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID) RETURNS void AS $$
DECLARE
  v_review_count INTEGER;
  v_helpful_count INTEGER;
  v_category_count INTEGER;
  v_achievement RECORD;
BEGIN
  SELECT review_count, total_helpful_count
  INTO v_review_count, v_helpful_count
  FROM public.users WHERE id = p_user_id;

  SELECT COUNT(DISTINCT s.category_id)
  INTO v_category_count
  FROM public.reviews r
  JOIN public.subjects s ON s.id = r.subject_id
  WHERE r.user_id = p_user_id AND r.is_deleted = false;

  FOR v_achievement IN SELECT * FROM public.achievements LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) THEN
      IF (v_achievement.condition_type = 'review_count' AND v_review_count >= v_achievement.condition_value) OR
         (v_achievement.condition_type = 'helpful_count' AND v_helpful_count >= v_achievement.condition_value) OR
         (v_achievement.condition_type = 'category_count' AND v_category_count >= v_achievement.condition_value)
      THEN
        INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  PERFORM public.compute_trust_score(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update existing review trigger to also check achievements
CREATE OR REPLACE FUNCTION public.after_review_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.check_achievements(NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.check_achievements(NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.check_achievements(OLD.user_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_review_change ON public.reviews;
CREATE TRIGGER trg_after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.after_review_change();

-- 8. Seed achievements
INSERT INTO public.achievements (key, name, description, icon, condition_type, condition_value) VALUES
  ('first_review', '{"ko":"첫 리뷰","en":"First Review"}', '{"ko":"첫 번째 리뷰를 작성했습니다","en":"Wrote your first review"}', '✍️', 'review_count', 1),
  ('reviewer_10', '{"ko":"리뷰어 10","en":"Reviewer 10"}', '{"ko":"10개의 리뷰를 작성했습니다","en":"Wrote 10 reviews"}', '📝', 'review_count', 10),
  ('reviewer_50', '{"ko":"열정 리뷰어","en":"Passionate Reviewer"}', '{"ko":"50개의 리뷰를 작성했습니다","en":"Wrote 50 reviews"}', '🔥', 'review_count', 50),
  ('reviewer_100', '{"ko":"리뷰 마스터","en":"Review Master"}', '{"ko":"100개의 리뷰를 작성했습니다","en":"Wrote 100 reviews"}', '💎', 'review_count', 100),
  ('helpful_10', '{"ko":"도움의 손길","en":"Helping Hand"}', '{"ko":"10개의 도움이 됐어요를 받았습니다","en":"Received 10 helpful votes"}', '👍', 'helpful_count', 10),
  ('helpful_50', '{"ko":"인플루언서","en":"Influencer"}', '{"ko":"50개의 도움이 됐어요를 받았습니다","en":"Received 50 helpful votes"}', '🌟', 'helpful_count', 50),
  ('helpful_100', '{"ko":"스타 리뷰어","en":"Star Reviewer"}', '{"ko":"100개의 도움이 됐어요를 받았습니다","en":"Received 100 helpful votes"}', '⭐', 'helpful_count', 100),
  ('explorer_3', '{"ko":"탐험가","en":"Explorer"}', '{"ko":"3개 이상의 카테고리에서 리뷰를 작성했습니다","en":"Reviewed in 3+ categories"}', '🗺️', 'category_count', 3),
  ('explorer_all', '{"ko":"세계 탐험가","en":"World Explorer"}', '{"ko":"모든 카테고리에서 리뷰를 작성했습니다","en":"Reviewed in all categories"}', '🌍', 'category_count', 6)
ON CONFLICT (key) DO NOTHING;

-- 9. Update public_profiles view to include trust_score
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = false) AS
  SELECT id, nickname, avatar_url, level, review_count, total_helpful_count, trust_score, created_at
  FROM public.users;
