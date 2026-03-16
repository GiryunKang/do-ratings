# Phase 2: Engagement & Gamification — Design Spec

**Date:** 2026-03-17
**Scope:** Badge/achievement system, trust score, comments, reactions

---

## 1. Badge/Achievement System

### 1.1 Database

New migration `007_achievements.sql`:

```sql
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL,          -- { ko: "첫 리뷰", en: "First Review" }
  description JSONB NOT NULL,   -- { ko: "첫 번째 리뷰를 작성했습니다", en: "Wrote your first review" }
  icon TEXT NOT NULL DEFAULT '🏆',
  condition_type TEXT NOT NULL,  -- 'review_count' | 'helpful_count' | 'category_count' | 'streak'
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
```

### 1.2 Seed Achievements

| Key | Icon | Condition | Value |
|-----|------|-----------|-------|
| first_review | ✍️ | review_count | 1 |
| reviewer_10 | 📝 | review_count | 10 |
| reviewer_50 | 🔥 | review_count | 50 |
| reviewer_100 | 💎 | review_count | 100 |
| helpful_10 | 👍 | helpful_count | 10 |
| helpful_50 | 🌟 | helpful_count | 50 |
| helpful_100 | ⭐ | helpful_count | 100 |
| explorer_3 | 🗺️ | category_count | 3 |
| explorer_all | 🌍 | category_count | 6 |

### 1.3 Achievement Check Trigger

Add to existing review insert trigger: after updating user stats, check achievements and auto-insert into `user_achievements`.

### 1.4 Components

**`src/components/user/AchievementBadge.tsx`** — single badge display (icon + tooltip with name)
**`src/components/user/AchievementList.tsx`** — grid of earned badges for profile page

### 1.5 UI Integration

- Profile page: show badges section after user stats
- ReviewCard: show top badge icon next to UserBadge (optional, max 1)

---

## 2. Trust/Credibility Score

### 2.1 Computation

Add `trust_score` column to `users` table (INTEGER 0-100). Computed by trigger:

```
trust_score = min(100,
  (review_count * 2) +
  (total_helpful_count * 3) +
  (account_age_days / 10) +
  (level_bonus)  -- bronze: 0, silver: 5, gold: 15, platinum: 30
)
```

### 2.2 Display

- `TrustBadge` component: small colored bar/pill showing score
- Colors: 0-30 gray, 31-60 blue, 61-80 green, 81-100 gold
- Shown on ReviewCard next to user info (subtle, small)
- Shown on Profile page

---

## 3. Comments on Reviews

### 3.1 Database

```sql
CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_comments_review ON public.review_comments(review_id);
```

### 3.2 Components

**`src/components/review/CommentSection.tsx`** — client component:
- Shows comment count, collapsed by default
- Click to expand: shows comments list + input field
- Comment input: textarea (max 500 chars) + submit button
- Each comment: user avatar/nickname, content, timeAgo
- Auth required to post

### 3.3 Integration

- Add to ReviewCard: comment count button in engagement bar
- Expand inline below the review card

---

## 4. Reactions (Emoji)

### 4.1 Database

```sql
CREATE TABLE public.review_reactions (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('like','love','wow','sad','angry')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

CREATE INDEX idx_review_reactions_review ON public.review_reactions(review_id);
```

One reaction per user per review (replaces if changed).

### 4.2 Components

**`src/components/review/ReactionBar.tsx`** — client component:
- Compact row of emoji buttons: 👍 ❤️ 😮 😢 😡
- Shows counts per reaction type
- Toggle: click to add/remove/change reaction
- Replaces or coexists with HelpfulButton in engagement bar

### 4.3 Integration

- Replace the standalone HelpfulButton with ReactionBar
- Keep helpful_count on reviews table (👍 reaction maps to helpful)
- Or: keep HelpfulButton as-is, add ReactionBar as additional engagement

**Decision: Keep HelpfulButton, add ReactionBar alongside it.** This preserves the existing helpful_count logic and adds reactions as supplementary engagement.

---

## 5. i18n Additions

```json
{
  "achievement": {
    "achievements": "업적",
    "earned": "획득",
    "noAchievements": "아직 업적이 없습니다"
  },
  "trust": {
    "trustScore": "신뢰도 점수"
  },
  "comment": {
    "comments": "댓글",
    "writeComment": "댓글을 작성하세요...",
    "submit": "등록",
    "noComments": "아직 댓글이 없습니다",
    "loginToComment": "로그인 후 댓글을 작성할 수 있습니다"
  },
  "reaction": {
    "like": "좋아요",
    "love": "최고",
    "wow": "놀라워요",
    "sad": "슬퍼요",
    "angry": "화나요"
  }
}
```

---

## 6. File Change Summary

### New Files
- `supabase/migrations/007_achievements.sql` — achievements + comments + reactions tables
- `src/components/user/AchievementBadge.tsx`
- `src/components/user/AchievementList.tsx`
- `src/components/user/TrustBadge.tsx`
- `src/components/review/CommentSection.tsx`
- `src/components/review/ReactionBar.tsx`

### Modified Files
- `src/app/[locale]/profile/[userId]/page.tsx` — achievements + trust score sections
- `src/components/review/ReviewCard.tsx` — reactions + comment count in engagement bar
- `src/i18n/messages/ko.json` — new keys
- `src/i18n/messages/en.json` — new keys
- `supabase/migrations/001_create_tables.sql` or new migration for trust_score column
