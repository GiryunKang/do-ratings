CREATE INDEX idx_reviews_subject_id ON reviews(subject_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_reviews_user_id ON reviews(user_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_reviews_helpful ON reviews(subject_id, helpful_count DESC) WHERE is_deleted = false;
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_subjects_ranking ON subjects(category_id, avg_rating DESC);
CREATE INDEX idx_subjects_name_ko_trgm ON subjects USING gin ((name->>'ko') gin_trgm_ops);
CREATE INDEX idx_subjects_name_en_trgm ON subjects USING gin ((name->>'en') gin_trgm_ops);
CREATE INDEX idx_subjects_name_en_fts ON subjects USING gin (to_tsvector('english', name->>'en'));
