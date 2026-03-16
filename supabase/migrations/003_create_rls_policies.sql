ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (true);

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (is_deleted = false);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "helpful_select" ON helpful_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "helpful_insert" ON helpful_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != (SELECT user_id FROM reviews WHERE id = review_id)
  );
CREATE POLICY "helpful_delete" ON helpful_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
