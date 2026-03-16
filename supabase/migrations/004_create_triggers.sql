CREATE OR REPLACE FUNCTION calculate_user_level(p_review_count INTEGER, p_helpful_count INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_review_count >= 200 AND p_helpful_count >= 500 THEN 'platinum'
    WHEN p_review_count >= 50  AND p_helpful_count >= 100 THEN 'gold'
    WHEN p_review_count >= 10  THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_overall_rating(p_sub_ratings JSONB)
RETURNS NUMERIC AS $$
DECLARE
  v_sum NUMERIC := 0;
  v_count INTEGER := 0;
  v_val NUMERIC;
  v_key TEXT;
BEGIN
  FOR v_key IN SELECT jsonb_object_keys(p_sub_ratings)
  LOOP
    v_val := (p_sub_ratings->>v_key)::NUMERIC;
    v_sum := v_sum + v_val;
    v_count := v_count + 1;
  END LOOP;
  IF v_count = 0 THEN RETURN 0; END IF;
  RETURN ROUND(v_sum / v_count, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION handle_review_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subject_count INTEGER;
  v_subject_avg NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.overall_rating := calculate_overall_rating(NEW.sub_ratings);
    SELECT review_count, avg_rating INTO v_subject_count, v_subject_avg
      FROM subjects WHERE id = NEW.subject_id;
    UPDATE subjects SET
      review_count = v_subject_count + 1,
      avg_rating = CASE
        WHEN v_subject_avg IS NULL THEN NEW.overall_rating
        ELSE ROUND(((v_subject_avg * v_subject_count) + NEW.overall_rating) / (v_subject_count + 1), 1)
      END,
      updated_at = now()
    WHERE id = NEW.subject_id;
    UPDATE users SET
      review_count = review_count + 1,
      level = calculate_user_level(review_count + 1, total_helpful_count),
      updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.sub_ratings IS DISTINCT FROM OLD.sub_ratings THEN
      NEW.overall_rating := calculate_overall_rating(NEW.sub_ratings);
    END IF;
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
      SELECT review_count INTO v_subject_count FROM subjects WHERE id = NEW.subject_id;
      UPDATE subjects SET
        review_count = GREATEST(v_subject_count - 1, 0),
        avg_rating = CASE
          WHEN v_subject_count <= 1 THEN NULL
          ELSE ROUND(((avg_rating * v_subject_count) - OLD.overall_rating) / (v_subject_count - 1), 1)
        END,
        updated_at = now()
      WHERE id = NEW.subject_id;
      UPDATE users SET
        review_count = GREATEST(review_count - 1, 0),
        level = calculate_user_level(GREATEST(review_count - 1, 0), total_helpful_count),
        updated_at = now()
      WHERE id = NEW.user_id;
    ELSIF NEW.overall_rating IS DISTINCT FROM OLD.overall_rating AND NEW.is_deleted = false THEN
      SELECT review_count FROM subjects WHERE id = NEW.subject_id INTO v_subject_count;
      UPDATE subjects SET
        avg_rating = CASE
          WHEN v_subject_count = 0 THEN NULL
          ELSE ROUND(((avg_rating * v_subject_count) - OLD.overall_rating + NEW.overall_rating) / v_subject_count, 1)
        END,
        updated_at = now()
      WHERE id = NEW.subject_id;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_change
  BEFORE INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_review_change();

CREATE OR REPLACE FUNCTION handle_helpful_vote_change()
RETURNS TRIGGER AS $$
DECLARE
  v_review_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    SELECT user_id INTO v_review_user_id FROM reviews WHERE id = NEW.review_id;
    UPDATE users SET
      total_helpful_count = total_helpful_count + 1,
      level = calculate_user_level(review_count, total_helpful_count + 1),
      updated_at = now()
    WHERE id = v_review_user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    SELECT user_id INTO v_review_user_id FROM reviews WHERE id = OLD.review_id;
    UPDATE users SET
      total_helpful_count = GREATEST(total_helpful_count - 1, 0),
      level = calculate_user_level(review_count, GREATEST(total_helpful_count - 1, 0)),
      updated_at = now()
    WHERE id = v_review_user_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_helpful_vote_change
  AFTER INSERT OR DELETE ON helpful_votes
  FOR EACH ROW EXECUTE FUNCTION handle_helpful_vote_change();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
