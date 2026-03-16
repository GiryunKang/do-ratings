# Ratings Platform Design Spec

## Overview

모든 것에 대해 리뷰하고 평점을 매기는 유니버설 리뷰 플랫폼.
항공사, 기업, 장소, 인물 등 다양한 카테고리를 지원하며, 사용자 참여와 체류 시간을 극대화하는 것이 핵심 목표.

## Target

- 시장: 한국 + 영어 동시 런칭 (다국어 지원)
- 플랫폼: 웹 (PWA) 우선 → 추후 React Native 앱 추가
- 수익 모델: 광고 (배너) → 추후 네이티브 광고 + 프리미엄 리스팅 추가

## Tech Stack

- **Frontend/Backend:** Next.js (모놀리식, SSR)
- **Database/Auth/Storage:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel
- **Search:** Supabase Full Text Search (영어) + pg_trgm (한국어 fuzzy match)
- **PWA:** next-pwa
- **i18n:** next-intl
- **Ads:** Google AdSense (MVP)

### Prerequisites
- Supabase 프로젝트 생성 + `pg_trgm` extension 활성화 (`CREATE EXTENSION pg_trgm`)
- Vercel 계정 연동
- Google AdSense 승인
- OAuth Provider 설정: Google (GCP Console), Apple (Apple Developer Account + Service ID), 카카오 (Kakao Developers)

## Rating Scale

- **별점 범위:** 1~5 (0.5 단위 증가, 예: 1.0, 1.5, 2.0 ... 5.0)
- **세부 항목(sub_ratings):** 동일하게 1~5 (0.5 단위)
- **종합 평점(overall_rating):** 세부 항목들의 산술 평균 (소수점 1자리 반올림)
- **대상 평균(avg_rating):** 전체 리뷰의 overall_rating 산술 평균 (소수점 1자리 반올림)

## Data Model

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID, PK | Supabase Auth UID |
| email | text | 이메일 (비공개, RLS로 본인만 조회) |
| nickname | text | 닉네임 (공개) |
| avatar_url | text, nullable | 프로필 이미지 URL |
| level | text, CHECK IN ('bronze','silver','gold','platinum') | 등급 |
| review_count | integer, default 0 | 작성 리뷰 수 (캐시) |
| total_helpful_count | integer, default 0 | 받은 총 도움이 됐어요 수 (캐시, 레벨 계산용) |
| created_at | timestamptz | 가입일 |
| updated_at | timestamptz | |

### categories
| Column | Type | Description |
|--------|------|-------------|
| id | UUID, PK | |
| name | jsonb | {"ko":"항공사","en":"Airlines"} |
| slug | text, unique | URL용 (airlines, hotels...) |
| icon | text | 아이콘 식별자 |
| sub_rating_criteria | jsonb | [{"key":"seat","ko":"좌석","en":"Seat"}, ...] |
| created_at | timestamptz | |

### subjects (리뷰 대상)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID, PK | |
| category_id | UUID, FK → categories | |
| name | jsonb | {"ko":"대한항공","en":"Korean Air"} |
| description | jsonb, nullable | 다국어 설명 |
| image_url | text, nullable | 대표 이미지 |
| avg_rating | numeric(3,1), nullable, default NULL | 캐시된 종합 평균 (리뷰 없으면 NULL) |
| review_count | integer, default 0 | 리뷰 수 (캐시) |
| metadata | jsonb, nullable | 카테고리별 부가정보 (주소, 연락처 등) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### reviews
| Column | Type | Description |
|--------|------|-------------|
| id | UUID, PK | |
| user_id | UUID, FK → users | |
| subject_id | UUID, FK → subjects | |
| overall_rating | numeric(3,1) | sub_ratings 평균 (자동 계산, 1.0~5.0) |
| sub_ratings | jsonb | {"seat":4.0,"service":5.0,"food":3.5,"value":4.0} |
| title | text, max 100자 | 리뷰 제목 |
| content | text, max 5000자 | 리뷰 본문 (HTML 태그 제거, sanitize) |
| helpful_count | integer, default 0 | 도움이 됐어요 수 (캐시) |
| is_deleted | boolean, default false | 소프트 삭제 |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| **UNIQUE** | (user_id, subject_id) | 1인 1리뷰 제한 |

### follows
| Column | Type | Description |
|--------|------|-------------|
| **PK** | (follower_id, following_id) | 복합 기본키 |
| follower_id | UUID, FK → users | |
| following_id | UUID, FK → users | |
| created_at | timestamptz | |
| **CHECK** | follower_id != following_id | 자기 자신 팔로우 방지 |

### helpful_votes
| Column | Type | Description |
|--------|------|-------------|
| **PK** | (user_id, review_id) | 복합 기본키 |
| user_id | UUID, FK → users | |
| review_id | UUID, FK → reviews | |
| created_at | timestamptz | |
| **CHECK** | 자기 리뷰 추천 방지 (RLS로 구현) | |

### reports (신고/모더레이션)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID, PK | |
| reporter_id | UUID, FK → users | 신고자 |
| review_id | UUID, FK → reviews | 신고 대상 리뷰 |
| reason | text, CHECK IN ('spam','abuse','inappropriate','fake') | 신고 사유 |
| description | text, nullable, max 500자 | 상세 설명 |
| status | text, CHECK IN ('pending','resolved','dismissed'), default 'pending' | 처리 상태 |
| created_at | timestamptz | |

## Key Indexes

```sql
-- 리뷰 조회 성능
CREATE INDEX idx_reviews_subject_id ON reviews(subject_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_reviews_user_id ON reviews(user_id, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_reviews_helpful ON reviews(subject_id, helpful_count DESC) WHERE is_deleted = false;

-- 피드 쿼리
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- 랭킹 쿼리
CREATE INDEX idx_subjects_ranking ON subjects(category_id, avg_rating DESC);

-- 검색 (언어별 별도 인덱스)
CREATE INDEX idx_subjects_name_ko_trgm ON subjects USING gin ((name->>'ko') gin_trgm_ops);
CREATE INDEX idx_subjects_name_en_trgm ON subjects USING gin ((name->>'en') gin_trgm_ops);
CREATE INDEX idx_subjects_name_en_fts ON subjects USING gin (to_tsvector('english', name->>'en'));
```

## DB Triggers & Functions

### 평점 계산 (증분 업데이트)
```
리뷰 INSERT 시:
  1. overall_rating = ROUND(AVG(sub_ratings values), 1)
  2. subjects: review_count += 1, avg_rating = 증분 계산
     새 avg = ((기존 avg * (count-1)) + new_rating) / count
  3. users: review_count += 1, 레벨 재계산

리뷰 UPDATE 시:
  1. overall_rating 재계산
  2. subjects.avg_rating 증분 업데이트
     새 avg = ((기존 avg * count) - old_rating + new_rating) / count

리뷰 DELETE (soft) 시:
  1. subjects: review_count -= 1
     IF review_count = 0 THEN avg_rating = NULL
     ELSE avg_rating = ((기존 avg * (count+1)) - old_rating) / count
  2. users: review_count -= 1, 레벨 재계산
```

### 도움이 됐어요 (증분 업데이트)
```
helpful_votes INSERT 시:
  1. reviews.helpful_count += 1
  2. 리뷰 작성자의 users.total_helpful_count += 1
  3. 리뷰 작성자 레벨 재계산

helpful_votes DELETE 시:
  1. reviews.helpful_count -= 1
  2. 리뷰 작성자의 users.total_helpful_count -= 1
  3. 리뷰 작성자 레벨 재계산
```

### 레벨 계산 로직
```sql
CASE
  WHEN review_count >= 200 AND total_helpful_count >= 500 THEN 'platinum'
  WHEN review_count >= 50  AND total_helpful_count >= 100 THEN 'gold'
  WHEN review_count >= 10  THEN 'silver'
  ELSE 'bronze'
END
```

## Admin System

### MVP Admin (초기)
- Supabase Dashboard에서 직접 카테고리/대상 관리
- `reports` 테이블 조회로 신고 처리
- 별도 admin UI 없이 시작

### Phase 2
- `/admin` 페이지 (관리자 전용, RLS + admin role)
- 카테고리/대상 CRUD
- 신고 처리 대시보드
- 사용자 관리 (정지/해제)

## Page Structure

```
/ (홈)
├── 인기 리뷰, 카테고리별 TOP 랭킹, 트렌딩 대상
├── AdSense 배너 (MVP)

/explore (탐색)
├── 카테고리 필터, 평점 필터, 지역 필터
├── 검색 바 (대상 이름, 카테고리 통합 검색)

/category/[slug] (카테고리 페이지)
├── 해당 카테고리 TOP 10 랭킹
├── 최신/인기순 리뷰 피드

/subject/[id] (대상 상세 페이지)
├── 종합 평점 + 세부 항목별 평점 차트
├── 리뷰 목록 (최신순/도움순 정렬, 커서 기반 페이지네이션)
├── 리뷰 작성 버튼
├── 배너 광고 영역

/write/[subject_id] (리뷰 작성)
├── 세부 항목별 별점 입력 (0.5 단위)
├── 제목 (max 100자) + 본문 (max 5000자)
├── 이미 작성한 경우 → 수정 모드로 전환

/profile/[user_id] (프로필)
├── 사용자 레벨/뱃지
├── 작성한 리뷰 목록
├── 팔로워/팔로잉 수

/feed (내 피드)
├── 팔로우한 유저의 새 리뷰 (커서 기반 페이지네이션)

/rankings (랭킹)
├── 카테고리별 TOP 10
├── 이번 주 인기 리뷰
├── 인기 리뷰어 순위

/auth/login, /auth/signup (인증)
├── 이메일/비밀번호 + 소셜 로그인 (Google, Apple, 카카오)

/settings (설정)
├── 프로필 수정, 언어 전환 (KO/EN)
```

## API Design

### Authentication (Supabase Auth)
- `supabase.auth.signUp()` — 이메일 회원가입
- `supabase.auth.signInWithPassword()` — 이메일 로그인
- `supabase.auth.signInWithOAuth()` — Google, Apple, 카카오

### Reviews (Supabase Client SDK)
- 리뷰 목록 (커서 기반): `supabase.from('reviews').select().eq('subject_id', id).lt('created_at', cursor_created_at).order('created_at', {ascending: false}).limit(20)`
- 리뷰 작성: `supabase.from('reviews').insert({...})`
- 리뷰 수정: `supabase.from('reviews').update({...}).eq('id', id)`
- 리뷰 삭제: `supabase.from('reviews').update({is_deleted: true}).eq('id', id)`

### Helpful Votes
- 추가: `supabase.from('helpful_votes').insert({user_id, review_id})`
- 취소: `supabase.from('helpful_votes').delete().match({user_id, review_id})`
- 조회: `supabase.from('helpful_votes').select().eq('user_id', uid).eq('review_id', rid)`

### Follow
- 팔로우: `supabase.from('follows').insert({follower_id, following_id})`
- 언팔로우: `supabase.from('follows').delete().match({follower_id, following_id})`

### Feed (fan-out-on-read)
```sql
SELECT r.* FROM reviews r
JOIN follows f ON f.following_id = r.user_id
WHERE f.follower_id = :current_user_id
  AND r.is_deleted = false
  AND (r.created_at, r.id) < (:cursor_created_at, :cursor_id)
ORDER BY r.created_at DESC, r.id DESC
LIMIT 20
```
MVP에서는 fan-out-on-read로 충분. 팔로워 수가 많아지면 materialized view 또는 별도 feed 테이블로 전환.

### Search
```sql
-- 영어: Full Text Search
SELECT * FROM subjects WHERE to_tsvector('english', name->>'en') @@ to_tsquery(:query);

-- 한국어: trigram fuzzy match
SELECT * FROM subjects WHERE name->>'ko' % :query ORDER BY similarity(name->>'ko', :query) DESC;
```

### Rankings
- 카테고리별 TOP 10: `SELECT * FROM subjects WHERE category_id = :id AND avg_rating IS NOT NULL ORDER BY avg_rating DESC LIMIT 10`
- 인기 리뷰: `SELECT * FROM reviews WHERE created_at > now() - interval '7 days' AND is_deleted = false ORDER BY helpful_count DESC LIMIT 10`
- 인기 리뷰어: `SELECT * FROM users ORDER BY review_count DESC, total_helpful_count DESC LIMIT 10`

### Pagination Strategy
- 모든 목록 API: **커서 기반 페이지네이션** 사용
- 커서: `created_at` + `id` 조합 (동일 시간 레코드 구분)
- 페이지 사이즈: 기본 20

## Security

### Supabase RLS Policies
```sql
-- users: RLS로 본인만 전체 조회, 타인은 public view 통해 접근
CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid() = id);

-- 공개 프로필 view (email 제외, SECURITY DEFINER로 RLS 우회)
CREATE VIEW public_profiles AS
  SELECT id, nickname, avatar_url, level, review_count, total_helpful_count, created_at
  FROM users;
-- 프론트엔드에서 타인 프로필 조회 시 public_profiles view 사용

-- categories, subjects: 누구나 조회
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "subjects_select" ON subjects FOR SELECT USING (true);

-- reviews: 누구나 조회, 본인만 CUD
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (is_deleted = false);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR UPDATE USING (auth.uid() = user_id);  -- soft delete

-- helpful_votes: 조회(토글 상태 확인) + 본인만 CUD, 자기 리뷰 추천 방지
CREATE POLICY "helpful_select" ON helpful_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "helpful_insert" ON helpful_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_id != (SELECT user_id FROM reviews WHERE id = review_id)
  );
CREATE POLICY "helpful_delete" ON helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- follows: 조회 + 본인만 CUD
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- reports: 본인 신고만 작성 가능
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
```

### Input Validation & Security
- 리뷰 제목: max 100자
- 리뷰 본문: max 5000자, HTML 태그 제거 (DOMPurify)
- 별점: 서버사이드 검증 (1.0~5.0, 0.5 단위)
- Rate limiting: Next.js middleware + in-memory store (MVP), 추후 Upstash Redis로 전환
  - 리뷰 작성: 1분에 최대 3회
  - 검색: 1초에 최대 5회
  - 도움이 됐어요: 1초에 최대 10회

### Privacy
- `email` 필드는 RLS로 본인만 조회 가능
- 공개 프로필은 DB view로 email 제외하여 노출
- 사용자 삭제 요청 시 soft delete + 개인정보 익명화

## User Level System

| Level | Condition | Badge |
|-------|-----------|-------|
| Bronze | 가입 시 기본 | 🥉 |
| Silver | 리뷰 10개+ | 🥈 |
| Gold | 리뷰 50개+ AND 도움이 됐어요 100개+ | 🥇 |
| Platinum | 리뷰 200개+ AND 도움이 됐어요 500개+ | 💎 |

### Level Benefits
- Silver+: 닉네임 옆 뱃지 표시
- Gold+: 리뷰 정렬 시 Gold/Platinum 리뷰에 가중치 부여 (기본 정렬에서 상단 노출)
- Platinum: 프로필에 "Top Reviewer" 태그

## Ad System

### MVP (Phase 1)
- Google AdSense 배너 광고
- 위치: 페이지 하단 고정 (모바일), 사이드바 (데스크톱)
- 페이지당 최대 1개
- 리뷰 작성 페이지 제외

### Phase 2 (트래픽 확보 후)
- 네이티브 광고: 리뷰 피드 내 7개마다 1개 삽입, "Sponsored" 라벨
- 프리미엄 리스팅: 기업 유료 구독 (검색 상단 노출, 공식 답변 기능)

## UI Components

### Layout
- Header: 로고, 검색바, 언어전환, 로그인/프로필
- BottomNav (모바일): 홈, 탐색, 랭킹, 피드, 프로필
- Sidebar (데스크톱): 카테고리 네비게이션
- AdBanner: 하단 고정 배너

### Core Components
- ReviewCard — 리뷰 카드 (별점, 제목, 내용 미리보기, 도움이 됐어요)
- StarRating — 별점 입력/표시 (0.5 단위, 1~5)
- SubRatingInput — 세부 항목별 별점 입력
- SubRatingChart — 세부 항목별 평점 바 차트
- ReviewForm — 리뷰 작성/수정 폼 (입력 검증 포함)
- HelpfulButton — 도움이 됐어요 토글
- ReportButton — 리뷰 신고 버튼
- UserBadge — 레벨 뱃지 (Bronze~Platinum)
- UserCard — 리뷰어 프로필 카드
- FollowButton — 팔로우 토글
- SearchBar — 통합 검색 (자동완성)
- FilterPanel — 카테고리/평점/지역 필터
- SortSelect — 정렬 (최신순, 평점순, 도움순)
- TrendingSubjects — 트렌딩 캐러셀
- CategoryRanking — 카테고리별 TOP 카드

## i18n Strategy

- 다국어 DB 필드: jsonb (`{"ko":"...","en":"..."}`)
- UI 텍스트: next-intl
- URL: `/ko/...`, `/en/...` locale prefix
- 기본 언어: 브라우저 Accept-Language 기반 자동 감지
- 지원 언어: ko, en

## PWA Configuration

- Service Worker: next-pwa
- Manifest: 앱 이름, 아이콘, 테마 색상
- 캐싱 전략:
  - 정적 자산 (CSS/JS/이미지): Cache First
  - API 응답: Network First (항상 최신 데이터 우선)
  - 오프라인: 캐시된 페이지 표시 + 오프라인 안내 페이지
- 설치 프롬프트: 3회 이상 방문 시 표시
