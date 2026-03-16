# Phase 1: Content Quality Enhancement — Design Spec

**Date:** 2026-03-17
**Scope:** Photo gallery, OG social share cards, comparison page

---

## 1. Photo Gallery (Review Image Upload)

### 1.1 Database

New migration `006_review_images.sql`:

```sql
CREATE TABLE public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_images_review ON public.review_images(review_id);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review images"
  ON public.review_images FOR SELECT USING (true);

CREATE POLICY "Users can insert own review images"
  ON public.review_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review images"
  ON public.review_images FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.2 Supabase Storage

- Bucket: `review-images` (public read, authenticated write)
- Path convention: `{user_id}/{review_id}/{uuid}.webp`
- Max file size: 5MB
- Allowed types: image/jpeg, image/png, image/webp
- Max 5 images per review

### 1.3 Client-Side Image Processing

Install `browser-image-compression` for client-side resize before upload.

```
npm install browser-image-compression
```

Options:
- maxWidthOrHeight: 1200px
- maxSizeMB: 1
- useWebWorker: true
- fileType: 'image/webp'

### 1.4 Components

**`src/components/review/ImageUpload.tsx`** (new)
- Drag-and-drop zone + file input button
- Preview thumbnails with remove button and drag-to-reorder
- Upload progress indicator per image
- Props: `images: ImageFile[]`, `onChange: (images: ImageFile[]) => void`, `maxImages: number`

**`src/components/review/ImageGallery.tsx`** (new)
- Grid layout: 1 image = full width, 2 = side-by-side, 3 = 1 large + 2 small, 4-5 = 2x2 grid + overflow
- Click opens lightbox modal
- Lightbox: full-screen overlay, left/right navigation, swipe on mobile, ESC to close
- Props: `images: { id: string, url: string }[]`

**Modified: `ReviewForm.tsx`**
- Add `ImageUpload` component between content textarea and submit button
- On submit: upload images to Storage, then insert `review_images` rows
- On edit: show existing images, allow add/remove

**Modified: `ReviewCard.tsx`**
- After content paragraph, show `ImageGallery` if review has images
- Fetch images via join: `review_images(id, storage_path, display_order)`

### 1.5 Subject Page Photo Section

**Modified: `src/app/[locale]/subject/[id]/page.tsx`**
- Add "Photos" section between SubRatingChart and Reviews
- Fetch all review_images for this subject (via reviews join), show grid (max 12 thumbnails)
- "See all photos" link if more than 12

---

## 2. Social Share Cards (OG Image Generation)

### 2.1 Approach

Use Next.js built-in `ImageResponse` from `next/og` (included in Next.js, no extra dependency).

Dynamic OG images generated at request time via route handlers, cached by Vercel CDN.

### 2.2 Routes

**`src/app/[locale]/subject/[id]/opengraph-image.tsx`**
- Renders: subject name, average star rating (visual stars), review count, category badge
- Size: 1200x630
- Style: white background, indigo accent, clean typography

**`src/app/[locale]/profile/[userId]/opengraph-image.tsx`**
- Renders: nickname, level badge, review count, avatar placeholder
- Size: 1200x630

### 2.3 Metadata Updates

**Modified: `src/app/[locale]/subject/[id]/page.tsx` — `generateMetadata`**
- Add `openGraph.images` pointing to the OG image route
- Add `twitter.card: 'summary_large_image'`

**Modified: `src/app/[locale]/profile/[userId]/page.tsx` — `generateMetadata`**
- Same pattern as subject page

### 2.4 Share Button Enhancement

**Modified: `ReviewCard.tsx`**
- The existing "share" button will copy the URL to clipboard and show a toast
- URL includes the subject page which has the OG image

---

## 3. Comparison Page

### 3.1 Route

**`src/app/[locale]/compare/page.tsx`** (new, client component)

URL: `/ko/compare?ids=uuid1,uuid2` or `/ko/compare?ids=uuid1,uuid2,uuid3`

### 3.2 UX Flow

1. User arrives at `/compare` (empty state with "Add subject" prompt)
2. Click "Add" opens a search modal (reuse existing SearchBar logic)
3. First subject selected → category locked (only same-category comparisons)
4. Add up to 3 subjects total
5. Desktop: columns side by side / Mobile: 2 columns, 3rd via horizontal scroll
6. URL updates as subjects are added → shareable link

### 3.3 Comparison Layout

Each column shows:
- Subject image/placeholder + name
- Overall average rating (stars + number)
- Review count
- Sub-rating bars (aligned across columns for visual comparison)
- "Winner" highlight: highest rating per criterion gets a subtle green accent
- Link to full subject page

### 3.4 Components

**`src/components/compare/CompareCard.tsx`** (new)
- Single subject column with all metrics
- Props: subject data + criteria + avgSubRatings

**`src/components/compare/SubjectPicker.tsx`** (new)
- Search modal for adding subjects to compare
- Filters by locked category after first selection
- Props: `categoryId: string | null`, `onSelect: (subject) => void`, `excludeIds: string[]`

### 3.5 Entry Points

**Modified: `src/app/[locale]/subject/[id]/page.tsx`**
- Add "Compare" button next to "Write Review" button
- Links to `/compare?ids={this_subject_id}`

**Modified: `src/app/[locale]/category/[slug]/page.tsx`**
- Add "Compare" link in the TOP 10 section header

### 3.6 Data Fetching

All fetching happens client-side via Supabase client:
- `subjects` table for basic info
- `reviews` table aggregation for sub_ratings averages
- `categories` for criteria definitions

No new API routes needed.

### 3.7 Dependencies

Install `recharts` for potential radar chart visualization of sub-ratings comparison:

```
npm install recharts
```

---

## 4. i18n Additions

New translation keys for `ko.json` / `en.json`:

```json
{
  "review": {
    "photos": "사진",
    "addPhotos": "사진 추가 (최대 5장)",
    "dragPhotos": "여기에 사진을 끌어놓으세요",
    "photoUploading": "업로드 중...",
    "seeAllPhotos": "모든 사진 보기"
  },
  "compare": {
    "title": "비교하기",
    "addSubject": "주제 추가",
    "selectSubject": "비교할 주제를 선택하세요",
    "sameCategoryOnly": "같은 카테고리만 비교 가능합니다",
    "winner": "최고",
    "noSubjects": "비교할 주제를 추가하세요",
    "compare": "비교",
    "removeSubject": "제거"
  },
  "share": {
    "copied": "링크가 복사되었습니다",
    "share": "공유"
  }
}
```

---

## 5. New Dependencies Summary

| Package | Purpose | Size |
|---------|---------|------|
| `browser-image-compression` | Client-side image resize before upload | ~25KB |
| `recharts` | Radar chart for comparison page | ~200KB (tree-shakeable) |

---

## 6. File Change Summary

### New Files
- `supabase/migrations/006_review_images.sql`
- `src/components/review/ImageUpload.tsx`
- `src/components/review/ImageGallery.tsx`
- `src/app/[locale]/subject/[id]/opengraph-image.tsx`
- `src/app/[locale]/profile/[userId]/opengraph-image.tsx`
- `src/app/[locale]/compare/page.tsx`
- `src/components/compare/CompareCard.tsx`
- `src/components/compare/SubjectPicker.tsx`

### Modified Files
- `src/components/review/ReviewForm.tsx` — add ImageUpload
- `src/components/review/ReviewCard.tsx` — add ImageGallery + share clipboard
- `src/app/[locale]/subject/[id]/page.tsx` — Photos section + Compare button + OG metadata
- `src/app/[locale]/profile/[userId]/page.tsx` — OG metadata
- `src/app/[locale]/category/[slug]/page.tsx` — Compare link
- `src/i18n/messages/ko.json` — new keys
- `src/i18n/messages/en.json` — new keys
- `package.json` — new dependencies
