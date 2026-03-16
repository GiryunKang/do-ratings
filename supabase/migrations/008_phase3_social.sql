-- Phase 3: Social & Community

-- 1. Collections (curated lists of subjects)
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title JSONB NOT NULL,           -- { ko: "서울 맛집 베스트", en: "Best Seoul Restaurants" }
  description JSONB,
  is_public BOOLEAN NOT NULL DEFAULT true,
  subject_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  note TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, subject_id)
);

CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public collections visible to all" ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users manage own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Collection items visible with collection" ON public.collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND (c.is_public = true OR c.user_id = auth.uid()))
);
CREATE POLICY "Users manage items in own collections" ON public.collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users delete items from own collections" ON public.collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
);

-- Update subject_count trigger
CREATE OR REPLACE FUNCTION public.update_collection_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections SET subject_count = subject_count + 1, updated_at = now() WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections SET subject_count = subject_count - 1, updated_at = now() WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_collection_item_count
  AFTER INSERT OR DELETE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.update_collection_count();

-- 2. Review Battles (head-to-head comparison votes)
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  review_a_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  review_b_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  votes_a INTEGER NOT NULL DEFAULT 0,
  votes_b INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  CHECK (review_a_id != review_b_id)
);

CREATE TABLE public.battle_votes (
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  voted_for TEXT NOT NULL CHECK (voted_for IN ('a','b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (battle_id, user_id)
);

CREATE INDEX idx_battles_subject ON public.battles(subject_id);
CREATE INDEX idx_battles_status ON public.battles(status);

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view battles" ON public.battles FOR SELECT USING (true);
CREATE POLICY "Anyone can view battle votes" ON public.battle_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.battle_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vote count trigger
CREATE OR REPLACE FUNCTION public.update_battle_votes() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voted_for = 'a' THEN
    UPDATE public.battles SET votes_a = votes_a + 1 WHERE id = NEW.battle_id;
  ELSE
    UPDATE public.battles SET votes_b = votes_b + 1 WHERE id = NEW.battle_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_battle_vote_count
  AFTER INSERT ON public.battle_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_battle_votes();

-- 3. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('helpful','comment','follow','achievement','battle')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
