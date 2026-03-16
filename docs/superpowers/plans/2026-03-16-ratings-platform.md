# Ratings Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a universal review/rating platform (web PWA) supporting multi-category reviews with user engagement features and ad monetization.

**Architecture:** Monolithic Next.js app with Supabase (PostgreSQL, Auth, Storage) backend, deployed on Vercel. SSR for SEO-critical pages (categories, subjects). PWA for mobile-app-like experience. next-intl for KO/EN i18n.

**Tech Stack:** Next.js 15 (App Router), Supabase, TypeScript, Tailwind CSS, next-intl, next-pwa, Google AdSense

**Spec:** `docs/superpowers/specs/2026-03-16-ratings-platform-design.md`

---

## File Structure

```
ratings/
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_create_indexes.sql
│       ├── 003_create_rls_policies.sql
│       ├── 004_create_triggers.sql
│       └── 005_seed_categories.sql
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx              — Root layout (Header, BottomNav, AdBanner)
│   │   │   ├── page.tsx                — Home page
│   │   │   ├── explore/
│   │   │   │   └── page.tsx            — Search & filter page
│   │   │   ├── category/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx        — Category detail page
│   │   │   ├── subject/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        — Subject detail page
│   │   │   ├── write/
│   │   │   │   └── [subjectId]/
│   │   │   │       └── page.tsx        — Review write/edit page
│   │   │   ├── profile/
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx        — User profile page
│   │   │   ├── feed/
│   │   │   │   └── page.tsx            — Follow feed page
│   │   │   ├── rankings/
│   │   │   │   └── page.tsx            — Rankings page
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx        — Login page
│   │   │   │   ├── signup/
│   │   │   │   │   └── page.tsx        — Signup page
│   │   │   │   └── callback/
│   │   │   │       └── route.ts        — OAuth callback handler
│   │   │   └── settings/
│   │   │       └── page.tsx            — User settings page
│   │   └── api/
│   │       └── search/
│   │           └── route.ts            — Search API (rate-limited)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── AdBanner.tsx
│   │   ├── review/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   ├── StarRating.tsx
│   │   │   ├── SubRatingInput.tsx
│   │   │   ├── SubRatingChart.tsx
│   │   │   ├── HelpfulButton.tsx
│   │   │   └── ReportButton.tsx
│   │   ├── user/
│   │   │   ├── UserBadge.tsx
│   │   │   ├── UserCard.tsx
│   │   │   └── FollowButton.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── SortSelect.tsx
│   │   ├── home/
│   │   │   ├── TrendingSubjects.tsx
│   │   │   └── CategoryRanking.tsx
│   │   └── ui/
│   │       ├── InfiniteScroll.tsx
│   │       └── LocaleSwitcher.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               — Browser Supabase client
│   │   │   ├── server.ts               — Server Supabase client
│   │   │   └── middleware.ts            — Auth middleware helper
│   │   ├── utils/
│   │   │   ├── rating.ts               — Rating calculation helpers
│   │   │   ├── sanitize.ts             — Input sanitization
│   │   │   └── cursor.ts               — Cursor pagination encode/decode
│   │   └── hooks/
│   │       ├── useAuth.ts              — Auth state hook
│   │       ├── useReviews.ts           — Reviews data hook
│   │       └── useInfiniteScroll.ts    — Infinite scroll hook
│   ├── types/
│   │   └── database.ts                 — Supabase generated types
│   └── i18n/
│       ├── request.ts                  — next-intl request config
│       ├── routing.ts                  — Locale routing config
│       └── messages/
│           ├── ko.json                 — Korean translations
│           └── en.json                 — English translations
├── public/
│   ├── manifest.json                   — PWA manifest
│   └── icons/                          — PWA icons
├── middleware.ts                        — next-intl + rate limiting middleware
├── next.config.ts                       — Next.js + PWA config
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                          — Supabase keys (gitignored)
```

---

## Chunk 1: Project Setup & Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `.gitignore`

- [ ] **Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
cd "/c/Users/USER/Documents/Projects/my dream/Ratings"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with App Router structure

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr next-intl next-pwa dompurify
npm install -D @types/dompurify supabase
```

- [ ] **Step 3: Create .env.local**

Create `.env.local` with placeholder values:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on localhost:3000

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with dependencies"
```

---

### Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`

- [ ] **Step 1: Write migration for all tables**

```sql
-- supabase/migrations/001_create_tables.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  level TEXT NOT NULL DEFAULT 'bronze' CHECK (level IN ('bronze','silver','gold','platinum')),
  review_count INTEGER NOT NULL DEFAULT 0,
  total_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public profiles view (excludes email)
CREATE VIEW public.public_profiles WITH (security_invoker = false) AS
  SELECT id, nickname, avatar_url, level, review_count, total_helpful_count, created_at
  FROM public.users;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'default',
  sub_rating_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subjects (review targets)
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  description JSONB,
  image_url TEXT,
  avg_rating NUMERIC(3,1),
  review_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  overall_rating NUMERIC(3,1) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
  sub_ratings JSONB NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  helpful_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_id)
);

-- Follows
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Helpful votes
CREATE TABLE public.helpful_votes (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, review_id)
);

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam','abuse','inappropriate','fake')),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Apply migration via Supabase Dashboard or CLI**

```bash
npx supabase db push
```

Or paste SQL directly into Supabase Dashboard > SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema migration"
```

---

### Task 3: Database Indexes

**Files:**
- Create: `supabase/migrations/002_create_indexes.sql`

- [ ] **Step 1: Write index migration**

```sql
-- supabase/migrations/002_create_indexes.sql

-- Review queries
CREATE INDEX idx_reviews_subject_id ON reviews(subject_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_reviews_user_id ON reviews(user_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_reviews_helpful ON reviews(subject_id, helpful_count DESC) WHERE is_deleted = false;

-- Feed queries
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Ranking queries
CREATE INDEX idx_subjects_ranking ON subjects(category_id, avg_rating DESC);

-- Search indexes (per-language)
CREATE INDEX idx_subjects_name_ko_trgm ON subjects USING gin ((name->>'ko') gin_trgm_ops);
CREATE INDEX idx_subjects_name_en_trgm ON subjects USING gin ((name->>'en') gin_trgm_ops);
CREATE INDEX idx_subjects_name_en_fts ON subjects USING gin (to_tsvector('english', name->>'en'));
```

- [ ] **Step 2: Apply migration**
- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database indexes for performance"
```

---

### Task 4: RLS Policies

**Files:**
- Create: `supabase/migrations/003_create_rls_policies.sql`

- [ ] **Step 1: Write RLS policies**

```sql
-- supabase/migrations/003_create_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users: only own record (others use public_profiles view)
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Categories: public read
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);

-- Subjects: public read
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (true);

-- Reviews: public read (non-deleted), own CUD
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (is_deleted = false);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Helpful votes: own select + CUD, prevent self-vote
CREATE POLICY "helpful_select" ON helpful_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "helpful_insert" ON helpful_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != (SELECT user_id FROM reviews WHERE id = review_id)
  );
CREATE POLICY "helpful_delete" ON helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- Follows: public read, own CUD
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Reports: own insert only
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
```

- [ ] **Step 2: Apply migration**
- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add RLS policies for all tables"
```

---

### Task 5: Database Triggers

**Files:**
- Create: `supabase/migrations/004_create_triggers.sql`

- [ ] **Step 1: Write trigger functions**

```sql
-- supabase/migrations/004_create_triggers.sql

-- Level calculation function
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

-- Calculate overall_rating from sub_ratings
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

-- Review insert/update trigger
CREATE OR REPLACE FUNCTION handle_review_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_rating NUMERIC;
  v_new_rating NUMERIC;
  v_subject_count INTEGER;
  v_subject_avg NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Calculate overall_rating
    NEW.overall_rating := calculate_overall_rating(NEW.sub_ratings);

    -- Update subject stats (incremental)
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

    -- Update user stats
    UPDATE users SET
      review_count = review_count + 1,
      level = calculate_user_level(review_count + 1, total_helpful_count),
      updated_at = now()
    WHERE id = NEW.user_id;

    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate overall if sub_ratings changed
    IF NEW.sub_ratings IS DISTINCT FROM OLD.sub_ratings THEN
      NEW.overall_rating := calculate_overall_rating(NEW.sub_ratings);
    END IF;

    -- Handle soft delete
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

    -- Handle rating change (non-delete update)
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

-- Helpful votes trigger
CREATE OR REPLACE FUNCTION handle_helpful_vote_change()
RETURNS TRIGGER AS $$
DECLARE
  v_review_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update review helpful count
    UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;

    -- Update review author's total helpful count + level
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

-- Auto-create user profile on auth signup
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
```

- [ ] **Step 2: Apply migration**
- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add database triggers for rating calculation and user levels"
```

---

### Task 6: Seed Categories

**Files:**
- Create: `supabase/migrations/005_seed_categories.sql`

- [ ] **Step 1: Write seed data**

```sql
-- supabase/migrations/005_seed_categories.sql

INSERT INTO categories (name, slug, icon, sub_rating_criteria) VALUES
(
  '{"ko":"항공사","en":"Airlines"}',
  'airlines',
  'plane',
  '[{"key":"seat","ko":"좌석","en":"Seat"},{"key":"service","ko":"서비스","en":"Service"},{"key":"food","ko":"기내식","en":"Food"},{"key":"entertainment","ko":"엔터테인먼트","en":"Entertainment"},{"key":"value","ko":"가성비","en":"Value"}]'
),
(
  '{"ko":"호텔","en":"Hotels"}',
  'hotels',
  'hotel',
  '[{"key":"room","ko":"객실","en":"Room"},{"key":"service","ko":"서비스","en":"Service"},{"key":"cleanliness","ko":"청결도","en":"Cleanliness"},{"key":"location","ko":"위치","en":"Location"},{"key":"value","ko":"가성비","en":"Value"}]'
),
(
  '{"ko":"레스토랑","en":"Restaurants"}',
  'restaurants',
  'utensils',
  '[{"key":"taste","ko":"맛","en":"Taste"},{"key":"service","ko":"서비스","en":"Service"},{"key":"ambiance","ko":"분위기","en":"Ambiance"},{"key":"value","ko":"가성비","en":"Value"}]'
),
(
  '{"ko":"기업","en":"Companies"}',
  'companies',
  'building',
  '[{"key":"product","ko":"제품/서비스","en":"Product/Service"},{"key":"support","ko":"고객지원","en":"Customer Support"},{"key":"value","ko":"가성비","en":"Value"},{"key":"reliability","ko":"신뢰도","en":"Reliability"}]'
),
(
  '{"ko":"장소","en":"Places"}',
  'places',
  'map-pin',
  '[{"key":"accessibility","ko":"접근성","en":"Accessibility"},{"key":"atmosphere","ko":"분위기","en":"Atmosphere"},{"key":"facilities","ko":"시설","en":"Facilities"},{"key":"value","ko":"가성비","en":"Value"}]'
),
(
  '{"ko":"인물","en":"People"}',
  'people',
  'user',
  '[{"key":"expertise","ko":"전문성","en":"Expertise"},{"key":"communication","ko":"소통","en":"Communication"},{"key":"reliability","ko":"신뢰도","en":"Reliability"}]'
);
```

- [ ] **Step 2: Apply migration**
- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: seed initial categories"
```

---

## Chunk 2: Supabase Client, Auth & i18n Setup

### Task 7: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
- Create: `src/types/database.ts`

- [ ] **Step 1: Generate TypeScript types from Supabase**

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

- [ ] **Step 2: Create browser Supabase client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create server Supabase client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create middleware helper**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/ src/types/
git commit -m "feat: add Supabase client setup (browser, server, middleware)"
```

---

### Task 8: i18n Setup with next-intl

**Files:**
- Create: `src/i18n/request.ts`, `src/i18n/routing.ts`
- Create: `src/i18n/messages/ko.json`, `src/i18n/messages/en.json`
- Modify: `middleware.ts`

- [ ] **Step 1: Create routing config**

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
})
```

- [ ] **Step 2: Create request config**

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 3: Create Korean translations**

```json
// src/i18n/messages/ko.json
{
  "common": {
    "appName": "Ratings",
    "search": "검색",
    "login": "로그인",
    "signup": "회원가입",
    "logout": "로그아웃",
    "settings": "설정",
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정",
    "loading": "로딩 중...",
    "noResults": "결과가 없습니다"
  },
  "nav": {
    "home": "홈",
    "explore": "탐색",
    "rankings": "랭킹",
    "feed": "피드",
    "profile": "프로필"
  },
  "review": {
    "writeReview": "리뷰 작성",
    "editReview": "리뷰 수정",
    "title": "제목",
    "content": "내용",
    "titlePlaceholder": "리뷰 제목을 입력하세요",
    "contentPlaceholder": "리뷰 내용을 작성하세요",
    "submit": "등록",
    "helpful": "도움이 됐어요",
    "report": "신고",
    "sortLatest": "최신순",
    "sortHelpful": "도움순",
    "sortRating": "평점순",
    "alreadyReviewed": "이미 리뷰를 작성했습니다"
  },
  "rating": {
    "overall": "종합 평점",
    "noRating": "아직 평점이 없습니다"
  },
  "user": {
    "reviews": "리뷰",
    "followers": "팔로워",
    "following": "팔로잉",
    "follow": "팔로우",
    "unfollow": "언팔로우",
    "topReviewer": "Top Reviewer"
  },
  "auth": {
    "email": "이메일",
    "password": "비밀번호",
    "nickname": "닉네임",
    "loginWith": "{provider}로 로그인",
    "signupWith": "{provider}로 회원가입",
    "orContinueWith": "또는"
  },
  "report": {
    "spam": "스팸",
    "abuse": "욕설/비방",
    "inappropriate": "부적절한 내용",
    "fake": "허위 리뷰",
    "description": "상세 설명 (선택)"
  }
}
```

- [ ] **Step 4: Create English translations**

```json
// src/i18n/messages/en.json
{
  "common": {
    "appName": "Ratings",
    "search": "Search",
    "login": "Log in",
    "signup": "Sign up",
    "logout": "Log out",
    "settings": "Settings",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "noResults": "No results found"
  },
  "nav": {
    "home": "Home",
    "explore": "Explore",
    "rankings": "Rankings",
    "feed": "Feed",
    "profile": "Profile"
  },
  "review": {
    "writeReview": "Write Review",
    "editReview": "Edit Review",
    "title": "Title",
    "content": "Content",
    "titlePlaceholder": "Enter review title",
    "contentPlaceholder": "Write your review",
    "submit": "Submit",
    "helpful": "Helpful",
    "report": "Report",
    "sortLatest": "Latest",
    "sortHelpful": "Most Helpful",
    "sortRating": "Rating",
    "alreadyReviewed": "You have already reviewed this"
  },
  "rating": {
    "overall": "Overall Rating",
    "noRating": "No ratings yet"
  },
  "user": {
    "reviews": "Reviews",
    "followers": "Followers",
    "following": "Following",
    "follow": "Follow",
    "unfollow": "Unfollow",
    "topReviewer": "Top Reviewer"
  },
  "auth": {
    "email": "Email",
    "password": "Password",
    "nickname": "Nickname",
    "loginWith": "Log in with {provider}",
    "signupWith": "Sign up with {provider}",
    "orContinueWith": "or"
  },
  "report": {
    "spam": "Spam",
    "abuse": "Abuse",
    "inappropriate": "Inappropriate",
    "fake": "Fake Review",
    "description": "Description (optional)"
  }
}
```

- [ ] **Step 5: Create root middleware combining i18n + Supabase auth**

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  // Apply intl middleware
  const intlResponse = intlMiddleware(request)

  // Merge cookies from supabase session update
  response.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  matcher: ['/', '/(ko|en)/:path*'],
}
```

- [ ] **Step 6: Update next.config.ts for next-intl**

```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 7: Commit**

```bash
git add src/i18n/ middleware.ts next.config.ts
git commit -m "feat: add i18n setup with next-intl (ko/en)"
```

---

### Task 9: Auth Pages (Login & Signup)

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/auth/login/page.tsx`, `src/app/[locale]/auth/signup/page.tsx`
- Create: `src/app/[locale]/auth/callback/route.ts`
- Create: `src/lib/hooks/useAuth.ts`

- [ ] **Step 1: Create root locale layout**

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '@/app/globals.css'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as any)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create useAuth hook**

```typescript
// src/lib/hooks/useAuth.ts
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading }
}
```

- [ ] **Step 3: Create login page**

```typescript
// src/app/[locale]/auth/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleOAuth(provider: 'google' | 'apple' | 'kakao') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center">{tc('login')}</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border p-3"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-blue-600 p-3 text-white font-medium hover:bg-blue-700">
            {tc('login')}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">{t('orContinueWith')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => handleOAuth('google')} className="w-full rounded-lg border p-3 hover:bg-gray-50">
            {t('loginWith', { provider: 'Google' })}
          </button>
          <button onClick={() => handleOAuth('kakao')} className="w-full rounded-lg border p-3 hover:bg-gray-50">
            {t('loginWith', { provider: 'Kakao' })}
          </button>
          <button onClick={() => handleOAuth('apple')} className="w-full rounded-lg border p-3 hover:bg-gray-50">
            {t('loginWith', { provider: 'Apple' })}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          <a href="/auth/signup" className="text-blue-600 hover:underline">{tc('signup')}</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create signup page**

Similar to login but calls `supabase.auth.signUp()` with additional `nickname` field in `options.data`.

- [ ] **Step 5: Create OAuth callback route**

```typescript
// src/app/[locale]/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(origin)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/lib/hooks/
git commit -m "feat: add auth pages (login, signup, OAuth callback)"
```

---

## Chunk 3: Layout & Core UI Components

### Task 10: Layout Components (Header, BottomNav, Sidebar)

**Files:**
- Create: `src/components/layout/Header.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/AdBanner.tsx`
- Create: `src/components/ui/LocaleSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx` — wrap with layout components

- [ ] **Step 1: Create Header component**

Header with logo, SearchBar placeholder, locale switcher, login/profile button. Responsive: full header on desktop, simplified on mobile.

- [ ] **Step 2: Create BottomNav component**

Mobile-only bottom navigation with 5 tabs: Home, Explore, Rankings, Feed, Profile. Uses `usePathname()` for active state.

- [ ] **Step 3: Create Sidebar component**

Desktop-only left sidebar showing categories list. Fetches categories from Supabase on mount.

- [ ] **Step 4: Create AdBanner component**

Placeholder div for Google AdSense. Renders in footer on mobile, sidebar on desktop. Excluded on `/write/` routes.

- [ ] **Step 5: Create LocaleSwitcher component**

Dropdown or toggle to switch between KO/EN. Uses `useRouter()` and `usePathname()` from next-intl.

- [ ] **Step 6: Integrate layout components into locale layout**

Update `src/app/[locale]/layout.tsx` to include Header, Sidebar, BottomNav, AdBanner.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/ src/components/ui/ src/app/
git commit -m "feat: add layout components (Header, BottomNav, Sidebar, AdBanner)"
```

---

### Task 11: StarRating & Review Components

**Files:**
- Create: `src/components/review/StarRating.tsx`
- Create: `src/components/review/SubRatingInput.tsx`
- Create: `src/components/review/SubRatingChart.tsx`
- Create: `src/components/review/ReviewCard.tsx`
- Create: `src/components/review/HelpfulButton.tsx`
- Create: `src/components/review/ReportButton.tsx`
- Create: `src/components/user/UserBadge.tsx`
- Create: `src/lib/utils/rating.ts`

- [ ] **Step 1: Create rating utility functions**

```typescript
// src/lib/utils/rating.ts
export function calculateOverallRating(subRatings: Record<string, number>): number {
  const values = Object.values(subRatings)
  if (values.length === 0) return 0
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return Math.round(avg * 2) / 2 // Round to nearest 0.5
}

export function validateRating(value: number): boolean {
  return value >= 1 && value <= 5 && value % 0.5 === 0
}
```

- [ ] **Step 2: Create StarRating component**

Interactive star rating component supporting 0.5 increments. Props: `value`, `onChange`, `readonly`, `size`. Uses filled/half/empty star SVGs.

- [ ] **Step 3: Create SubRatingInput component**

Renders a list of criteria (from category) with a StarRating for each. Props: `criteria` (from category.sub_rating_criteria), `values`, `onChange`.

- [ ] **Step 4: Create SubRatingChart component**

Horizontal bar chart showing average sub-ratings. Props: `criteria`, `values`. Each bar shows label + filled bar + numeric value.

- [ ] **Step 5: Create UserBadge component**

```typescript
// src/components/user/UserBadge.tsx
const BADGE_CONFIG = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  silver:   { label: 'Silver',   color: 'text-gray-500',   bg: 'bg-gray-100' },
  gold:     { label: 'Gold',     color: 'text-yellow-600', bg: 'bg-yellow-100' },
  platinum: { label: 'Platinum', color: 'text-blue-600',   bg: 'bg-blue-100' },
} as const
```

Small inline badge showing user level.

- [ ] **Step 6: Create ReviewCard component**

Card showing: user avatar + nickname + badge, star rating, title, content preview (2 lines), helpful count, time ago. Props: `review` (with joined user data).

- [ ] **Step 7: Create HelpfulButton component**

Toggle button. Checks if current user already voted. Calls Supabase insert/delete on click. Shows count. Disabled if not logged in or is own review.

- [ ] **Step 8: Create ReportButton component**

Opens modal with reason selection (spam/abuse/inappropriate/fake) + optional description. Submits to `reports` table.

- [ ] **Step 9: Commit**

```bash
git add src/components/review/ src/components/user/ src/lib/utils/
git commit -m "feat: add review and rating UI components"
```

---

### Task 12: Cursor Pagination & Infinite Scroll

**Files:**
- Create: `src/lib/utils/cursor.ts`
- Create: `src/components/ui/InfiniteScroll.tsx`
- Create: `src/lib/hooks/useInfiniteScroll.ts`

- [ ] **Step 1: Create cursor utilities**

```typescript
// src/lib/utils/cursor.ts
export function encodeCursor(createdAt: string, id: string): string {
  return btoa(JSON.stringify({ createdAt, id }))
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    return JSON.parse(atob(cursor))
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Create useInfiniteScroll hook**

Generic hook that takes a fetch function and returns `{ data, loading, hasMore, loadMore }`. Uses IntersectionObserver to trigger loadMore.

- [ ] **Step 3: Create InfiniteScroll component**

Wrapper component that renders children + a sentinel div observed by IntersectionObserver. Shows loading spinner when fetching.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/cursor.ts src/components/ui/ src/lib/hooks/
git commit -m "feat: add cursor pagination and infinite scroll"
```

---

## Chunk 4: Core Pages

### Task 13: Home Page

**Files:**
- Create: `src/app/[locale]/page.tsx`
- Create: `src/components/home/TrendingSubjects.tsx`, `src/components/home/CategoryRanking.tsx`

- [ ] **Step 1: Create TrendingSubjects component**

Horizontal scrollable carousel of subjects with highest review activity in last 7 days. Each card shows subject name, category, avg_rating, review_count.

- [ ] **Step 2: Create CategoryRanking component**

For each category, shows TOP 5 subjects by avg_rating in a compact list. Links to full category page.

- [ ] **Step 3: Create Home page**

SSR page composing TrendingSubjects + CategoryRanking sections. Fetches data server-side for SEO.

- [ ] **Step 4: Commit**

```bash
git add src/app/ src/components/home/
git commit -m "feat: add home page with trending subjects and category rankings"
```

---

### Task 14: Category & Subject Pages

**Files:**
- Create: `src/app/[locale]/category/[slug]/page.tsx`
- Create: `src/app/[locale]/subject/[id]/page.tsx`
- Create: `src/components/review/ReviewList.tsx`
- Create: `src/components/search/SortSelect.tsx`

- [ ] **Step 1: Create ReviewList component**

Renders a list of ReviewCards with InfiniteScroll. Accepts `subjectId` and `sortBy` (latest/helpful). Fetches reviews with cursor pagination.

- [ ] **Step 2: Create SortSelect component**

Dropdown to switch between Latest/Most Helpful/Rating sort orders.

- [ ] **Step 3: Create Category page (SSR)**

Fetches category by slug. Shows TOP 10 ranking + latest reviews in that category. SEO metadata.

- [ ] **Step 4: Create Subject detail page (SSR)**

Fetches subject by id. Shows:
- Subject name, image, overall avg_rating
- SubRatingChart (average of all reviews' sub_ratings)
- "Write Review" button (or "Edit Review" if already reviewed)
- ReviewList with sort options

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/components/review/ src/components/search/
git commit -m "feat: add category and subject detail pages"
```

---

### Task 15: Review Write/Edit Page

**Files:**
- Create: `src/app/[locale]/write/[subjectId]/page.tsx`
- Create: `src/components/review/ReviewForm.tsx`
- Create: `src/lib/utils/sanitize.ts`

- [ ] **Step 1: Create sanitize utility**

```typescript
// src/lib/utils/sanitize.ts
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .trim()
}

export function validateReviewInput(title: string, content: string): string | null {
  if (title.length === 0) return 'Title is required'
  if (title.length > 100) return 'Title must be 100 characters or less'
  if (content.length === 0) return 'Content is required'
  if (content.length > 5000) return 'Content must be 5000 characters or less'
  return null
}
```

- [ ] **Step 2: Create ReviewForm component**

Form with SubRatingInput + title input + content textarea. Shows character counts. Validates on submit. If user already has a review for this subject, pre-fills form in edit mode.

- [ ] **Step 3: Create Write page**

Protected route (redirects to login if not authenticated). Fetches subject info + category criteria. Checks for existing review. Renders ReviewForm.

- [ ] **Step 4: Commit**

```bash
git add src/app/ src/components/review/ src/lib/utils/
git commit -m "feat: add review write/edit page with validation"
```

---

### Task 16: User Profile Page

**Files:**
- Create: `src/app/[locale]/profile/[userId]/page.tsx`
- Create: `src/components/user/UserCard.tsx`
- Create: `src/components/user/FollowButton.tsx`

- [ ] **Step 1: Create FollowButton component**

Toggle button. Checks if current user follows target user. Calls Supabase insert/delete on click. Shows follow/unfollow text.

- [ ] **Step 2: Create UserCard component**

Shows avatar, nickname, UserBadge, review_count, follower/following counts. "Top Reviewer" tag if platinum.

- [ ] **Step 3: Create Profile page**

Fetches user from `public_profiles` view. Shows UserCard + FollowButton + user's reviews (ReviewList filtered by user_id). If viewing own profile, shows edit button linking to settings.

- [ ] **Step 4: Commit**

```bash
git add src/app/ src/components/user/
git commit -m "feat: add user profile page with follow functionality"
```

---

### Task 17: Feed Page

**Files:**
- Create: `src/app/[locale]/feed/page.tsx`

- [ ] **Step 1: Create Feed page**

Protected route. Uses Supabase RPC or direct query to fetch reviews from followed users (fan-out-on-read query from spec). Renders with ReviewList + InfiniteScroll. Shows empty state if not following anyone.

- [ ] **Step 2: Commit**

```bash
git add src/app/
git commit -m "feat: add feed page showing followed users' reviews"
```

---

### Task 18: Rankings Page

**Files:**
- Create: `src/app/[locale]/rankings/page.tsx`

- [ ] **Step 1: Create Rankings page**

Three tabs/sections:
1. Category TOP 10 — dropdown to select category, shows subjects sorted by avg_rating
2. Popular Reviews — this week's reviews sorted by helpful_count
3. Top Reviewers — users sorted by review_count + total_helpful_count

SSR for SEO.

- [ ] **Step 2: Commit**

```bash
git add src/app/
git commit -m "feat: add rankings page (subjects, reviews, reviewers)"
```

---

## Chunk 5: Search, Settings & Polish

### Task 19: Search & Explore Page

**Files:**
- Create: `src/app/api/search/route.ts`
- Create: `src/app/[locale]/explore/page.tsx`
- Create: `src/components/search/SearchBar.tsx`, `src/components/search/FilterPanel.tsx`

- [ ] **Step 1: Create Search API route with rate limiting**

```typescript
// src/app/api/search/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiter (MVP)
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const locale = searchParams.get('locale') ?? 'ko'

  const supabase = await createClient()

  let query = supabase.from('subjects').select('*, categories(name, slug)')

  if (q) {
    if (locale === 'en') {
      query = query.textSearch(`name->>'en'`, q)
    } else {
      query = query.ilike(`name->>'ko'`, `%${q}%`)
    }
  }

  if (category) {
    query = query.eq('category_id', category)
  }

  const { data, error } = await query.order('avg_rating', { ascending: false, nullsFirst: false }).limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Create SearchBar component**

Input with debounced search (300ms). Calls `/api/search` endpoint. Shows dropdown with autocomplete results. Uses `useRouter` to navigate to explore page on enter.

- [ ] **Step 3: Create FilterPanel component**

Sidebar/drawer with:
- Category filter (checkboxes from categories table)
- Rating filter (minimum avg_rating slider)
- Clear filters button

- [ ] **Step 4: Create Explore page**

Full search + browse page. SearchBar at top, FilterPanel on side, results grid. Supports URL query params for shareable searches.

- [ ] **Step 5: Integrate SearchBar into Header**

Update Header to include SearchBar (collapsed on mobile, expanded on desktop).

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/components/search/ src/components/layout/Header.tsx
git commit -m "feat: add search API, explore page, and search bar"
```

---

### Task 20: Settings Page

**Files:**
- Create: `src/app/[locale]/settings/page.tsx`

- [ ] **Step 1: Create Settings page**

Protected route. Form to edit: nickname, avatar_url. Language switcher. Updates `users` table via Supabase.

- [ ] **Step 2: Commit**

```bash
git add src/app/
git commit -m "feat: add user settings page"
```

---

### Task 21: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.ts` — add next-pwa config

- [ ] **Step 1: Create PWA manifest**

```json
{
  "name": "Ratings",
  "short_name": "Ratings",
  "description": "Rate and review everything",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Update next.config.ts with PWA**

```typescript
import createNextIntlPlugin from 'next-intl/plugin'
import withPWAInit from 'next-pwa'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

export default withPWA(withNextIntl({}))
```

- [ ] **Step 3: Create placeholder PWA icons**

Create simple placeholder icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`.

- [ ] **Step 4: Commit**

```bash
git add public/ next.config.ts
git commit -m "feat: add PWA configuration with manifest and service worker"
```

---

### Task 22: Google AdSense Integration

**Files:**
- Modify: `src/components/layout/AdBanner.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Update AdBanner with AdSense script**

Add Google AdSense auto ad script to the layout head. AdBanner component renders `<ins>` element with AdSense attributes. Skipped on `/write/` routes.

- [ ] **Step 2: Add .env variable for AdSense client ID**

Add `NEXT_PUBLIC_ADSENSE_CLIENT_ID` to `.env.local`.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/ src/app/
git commit -m "feat: add Google AdSense banner integration"
```

---

### Task 23: Final Integration & Deployment

**Files:**
- Modify: various files for final wiring

- [ ] **Step 1: Connect .env.local with actual Supabase credentials**

Update `.env.local` with real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 2: Run full build and verify**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Test all pages manually**

Navigate through: Home → Category → Subject → Write Review → Profile → Feed → Rankings → Explore → Settings → Login/Signup

- [ ] **Step 4: Deploy to Vercel**

```bash
npx vercel --prod
```

- [ ] **Step 5: Add .superpowers to .gitignore**

```bash
echo ".superpowers/" >> .gitignore
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: final integration and deployment configuration"
```
