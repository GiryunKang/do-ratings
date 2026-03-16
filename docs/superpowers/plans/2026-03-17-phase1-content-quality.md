# Phase 1: Content Quality Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add photo gallery (review image upload), dynamic OG social share cards, and a comparison page to the Ratings platform.

**Architecture:** Supabase Storage for images, `review_images` table with RLS, Next.js `ImageResponse` for OG images, client-side comparison page with recharts radar chart. All within existing Next.js 15 App Router monolith.

**Tech Stack:** Next.js 15, Supabase (Storage + PostgreSQL), browser-image-compression, recharts, next/og (built-in)

**Spec:** `docs/superpowers/specs/2026-03-17-phase1-content-quality-design.md`

---

## File Structure

```
New files:
├── supabase/migrations/006_review_images.sql     — review_images table + RLS
├── src/components/review/ImageUpload.tsx          — drag-drop image upload with preview
├── src/components/review/ImageGallery.tsx         — image grid + lightbox modal
├── src/components/compare/CompareCard.tsx         — single subject comparison column
├── src/components/compare/SubjectPicker.tsx       — search modal to pick subjects
├── src/app/[locale]/compare/page.tsx              — comparison page
├── src/app/[locale]/subject/[id]/opengraph-image.tsx  — dynamic OG image for subjects
└── src/app/[locale]/profile/[userId]/opengraph-image.tsx — dynamic OG image for profiles

Modified files:
├── package.json                                   — add browser-image-compression, recharts
├── src/i18n/messages/ko.json                      — new translation keys
├── src/i18n/messages/en.json                      — new translation keys
├── src/components/review/ReviewForm.tsx            — integrate ImageUpload
├── src/components/review/ReviewCard.tsx            — integrate ImageGallery + share button
├── src/app/[locale]/subject/[id]/page.tsx          — Photos section + Compare button + OG meta
├── src/app/[locale]/profile/[userId]/page.tsx      — OG metadata
└── src/app/[locale]/category/[slug]/page.tsx       — Compare link in TOP 10
```

---

## Chunk 1: Database, Dependencies & i18n

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install browser-image-compression and recharts**

```bash
cd "C:/Users/USER/Documents/Projects/my dream/Ratings"
npm install browser-image-compression recharts
```

- [ ] **Step 2: Verify build still passes**

```bash
npx next build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add browser-image-compression and recharts"
```

---

### Task 2: Create review_images migration

**Files:**
- Create: `supabase/migrations/006_review_images.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Review images table for photo gallery feature
CREATE TABLE public.review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_images_review ON public.review_images(review_id);
CREATE INDEX idx_review_images_user ON public.review_images(user_id);

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

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/006_review_images.sql
git commit -m "feat: add review_images table migration with RLS"
```

---

### Task 3: Add i18n translation keys

**Files:**
- Modify: `src/i18n/messages/ko.json:36` (after `alreadyReviewed`)
- Modify: `src/i18n/messages/en.json:36` (after `alreadyReviewed`)

- [ ] **Step 1: Add new keys to ko.json**

Add to the `review` section (after `"alreadyReviewed"`):
```json
    "photos": "사진",
    "addPhotos": "사진 추가 (최대 5장)",
    "dragPhotos": "여기에 사진을 끌어놓으세요",
    "photoUploading": "업로드 중...",
    "seeAllPhotos": "모든 사진 보기"
```

Add new top-level sections before the closing `}`:
```json
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
```

- [ ] **Step 2: Add new keys to en.json**

Same structure with English values:

Add to the `review` section:
```json
    "photos": "Photos",
    "addPhotos": "Add photos (up to 5)",
    "dragPhotos": "Drag photos here",
    "photoUploading": "Uploading...",
    "seeAllPhotos": "See all photos"
```

Add new top-level sections:
```json
  "compare": {
    "title": "Compare",
    "addSubject": "Add Subject",
    "selectSubject": "Select a subject to compare",
    "sameCategoryOnly": "Only same-category comparisons allowed",
    "winner": "Best",
    "noSubjects": "Add subjects to compare",
    "compare": "Compare",
    "removeSubject": "Remove"
  },
  "share": {
    "copied": "Link copied!",
    "share": "Share"
  }
```

- [ ] **Step 3: Verify build**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/messages/ko.json src/i18n/messages/en.json
git commit -m "i18n: add photo gallery, compare, and share translation keys"
```

---

## Chunk 2: Photo Gallery — ImageUpload & ImageGallery Components

### Task 4: Create ImageUpload component

**Files:**
- Create: `src/components/review/ImageUpload.tsx`

- [ ] **Step 1: Write ImageUpload component**

This is a client component with:
- Drag-and-drop zone with visual feedback (border highlight on dragover)
- Hidden file input triggered by a button
- Accept: `image/jpeg,image/png,image/webp`
- Max 5 images validation
- Preview grid with thumbnails (object-fit cover, 80x80)
- Remove button (X) on each thumbnail
- Drag-to-reorder via simple swap on click
- Uses `browser-image-compression` to compress before passing to parent
- State: `compressing: boolean` shown as overlay on the drop zone

Interface:
```typescript
export interface ImageFile {
  id: string          // client-generated uuid for tracking
  file: File          // compressed file ready for upload
  previewUrl: string  // object URL for preview
}

interface ImageUploadProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  maxImages?: number  // default 5
  disabled?: boolean
}
```

Key behavior:
- `onChange` is called with the new full array after add/remove/reorder
- Compression options: `{ maxWidthOrHeight: 1200, maxSizeMB: 1, useWebWorker: true, fileType: 'image/webp' }`
- Revoke object URLs on unmount via useEffect cleanup
- Show count indicator: `{images.length}/{maxImages}`

- [ ] **Step 2: Verify it compiles**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/review/ImageUpload.tsx
git commit -m "feat: add ImageUpload component with drag-drop and compression"
```

---

### Task 5: Create ImageGallery component

**Files:**
- Create: `src/components/review/ImageGallery.tsx`

- [ ] **Step 1: Write ImageGallery component**

This is a client component with two parts:

**Grid display:**
- 1 image: full width, rounded, max-h-64
- 2 images: 2-column grid, equal height
- 3 images: 1 large left + 2 stacked right
- 4-5 images: 2x2 grid, 5th image shows "+N" overlay on 4th cell
- All images: `object-cover`, `rounded-lg`, `cursor-pointer`

**Lightbox modal (inline, no library):**
- Fixed overlay `bg-black/90 z-50 inset-0`
- Centered image with `object-contain max-h-[85vh]`
- Left/right arrow buttons (hidden if single image)
- Close button (X) top-right
- `ESC` key closes, arrow keys navigate
- Click outside image closes
- Touch swipe support via `onTouchStart/onTouchEnd` with 50px threshold
- Prevent body scroll when open (`overflow-hidden` on body)

Interface:
```typescript
interface GalleryImage {
  id: string
  url: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/review/ImageGallery.tsx
git commit -m "feat: add ImageGallery component with grid and lightbox"
```

---

### Task 6: Integrate ImageUpload into ReviewForm

**Files:**
- Modify: `src/components/review/ReviewForm.tsx`

- [ ] **Step 1: Update ReviewForm**

Changes needed:
1. Import `ImageUpload` and its `ImageFile` type
2. Import `createClient` (already imported)
3. Add state: `const [images, setImages] = useState<ImageFile[]>([])`
4. Add state: `const [existingImages, setExistingImages] = useState<{id: string, url: string, storage_path: string}[]>([])`
5. Add state: `const [removedImageIds, setRemovedImageIds] = useState<string[]>([])`
6. In `handleSubmit`, after the review insert/update succeeds:
   - Get the review ID (from insert response or existingReview.id)
   - For each new image in `images`:
     - Upload to Supabase Storage: `review-images/{user_id}/{review_id}/{crypto.randomUUID()}.webp`
     - Insert row into `review_images` table with `storage_path`, `display_order`, `review_id`, `user_id`
   - For each ID in `removedImageIds`:
     - Delete from `review_images` table
     - Delete from Storage
7. When editing (`existingReview` exists), on mount fetch existing images:
   ```typescript
   useEffect(() => {
     if (!existingReview) return
     const supabase = createClient()
     supabase
       .from('review_images')
       .select('id, storage_path, display_order')
       .eq('review_id', existingReview.id)
       .order('display_order')
       .then(({ data }) => {
         if (data) {
           const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/review-images/'
           setExistingImages(data.map(img => ({
             id: img.id,
             url: storageUrl + img.storage_path,
             storage_path: img.storage_path,
           })))
         }
       })
   }, [existingReview])
   ```
8. Add `<ImageUpload>` component in the form between the content textarea section and the error section (before line 180 in current file)
9. Pass combined count check: `maxImages={5 - existingImages.length + removedImageIds.length}`
10. Show existing images as non-editable thumbnails with remove button
11. Update the insert call to return the review id: `.insert({...}).select('id').single()`

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/review/ReviewForm.tsx
git commit -m "feat: integrate ImageUpload into ReviewForm with Storage upload"
```

---

### Task 7: Integrate ImageGallery into ReviewCard

**Files:**
- Modify: `src/components/review/ReviewCard.tsx`

- [ ] **Step 1: Update ReviewCard**

Changes needed:
1. Import `ImageGallery` from `./ImageGallery`
2. Add `images?: { id: string, url: string }[]` to the `review` interface in `ReviewCardProps`
3. After the content paragraph (line 82: `<p className="text-sm...`), add:
   ```tsx
   {/* Photo Gallery */}
   {review.images && review.images.length > 0 && (
     <div className="mt-2">
       <ImageGallery images={review.images} />
     </div>
   )}
   ```
4. Update the share button (line 99-118) to copy URL to clipboard:
   ```tsx
   <button
     type="button"
     onClick={() => {
       const url = window.location.origin + subjectHref
       navigator.clipboard.writeText(url)
       // Simple toast: temporarily change button text
     }}
     className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
   >
     ...share icon...
     {shareText}
   </button>
   ```
   Add state `const [shareText, setShareText] = useState('공유')` and reset after 2s.

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/review/ReviewCard.tsx
git commit -m "feat: add photo gallery and clipboard share to ReviewCard"
```

---

### Task 8: Add Photos section to Subject page

**Files:**
- Modify: `src/app/[locale]/subject/[id]/page.tsx`

- [ ] **Step 1: Update Subject page**

Changes needed:
1. Import `ImageGallery` from `@/components/review/ImageGallery`
2. After the `avgSubRatings` computation (around line 102), fetch review images for this subject:
   ```typescript
   const { data: subjectImages } = await supabase
     .from('review_images')
     .select('id, storage_path, review_id')
     .in('review_id',
       (await supabase.from('reviews').select('id').eq('subject_id', id)).data?.map(r => r.id) ?? []
     )
     .order('created_at', { ascending: false })
     .limit(12)
   ```
   Alternatively, use a simpler approach — fetch via a join:
   ```typescript
   const { data: reviewsWithImages } = await supabase
     .from('reviews')
     .select('review_images(id, storage_path, display_order)')
     .eq('subject_id', id)
     .limit(20)

   const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/review-images/'
   const allImages = (reviewsWithImages ?? [])
     .flatMap(r => (r.review_images as any[]) ?? [])
     .slice(0, 12)
     .map(img => ({ id: img.id, url: storageBase + img.storage_path }))
   ```
3. Add Photos section in the JSX between SubRatingChart and "Write Review" button (before line 164):
   ```tsx
   {/* Photos */}
   {allImages.length > 0 && (
     <div className="mt-4 pt-4 border-t border-gray-100">
       <h3 className="text-sm font-semibold text-gray-700 mb-2">Photos</h3>
       <ImageGallery images={allImages} />
     </div>
   )}
   ```

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/subject/[id]/page.tsx"
git commit -m "feat: add Photos section to subject detail page"
```

---

## Chunk 3: OG Social Share Cards

### Task 9: Create Subject OG image route

**Files:**
- Create: `src/app/[locale]/subject/[id]/opengraph-image.tsx`

- [ ] **Step 1: Write the OG image route**

```tsx
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Subject Rating'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('name, avg_rating, review_count, categories(name, slug)')
    .eq('id', id)
    .single()

  if (!subject) {
    return new ImageResponse(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f9fafb', fontSize: 48 }}>
        Ratings
      </div>,
      { ...size }
    )
  }

  const name = typeof subject.name === 'object'
    ? ((subject.name as Record<string, string>)[locale] ?? (subject.name as Record<string, string>).en)
    : String(subject.name)

  const cat = Array.isArray(subject.categories) ? subject.categories[0] : subject.categories
  const categoryName = cat
    ? ((cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>).en)
    : ''

  const rating = subject.avg_rating ? Number(subject.avg_rating).toFixed(1) : '—'
  const fullStars = Math.floor(Number(subject.avg_rating ?? 0))
  const hasHalf = (Number(subject.avg_rating ?? 0) - fullStars) >= 0.25

  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', backgroundColor: 'white', padding: 60,
    }}>
      {/* Category badge */}
      <div style={{ display: 'flex', fontSize: 24, color: '#6366f1', marginBottom: 16, fontWeight: 600 }}>
        {categoryName}
      </div>
      {/* Subject name */}
      <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 24 }}>
        {name}
      </div>
      {/* Stars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: 48, color: i < fullStars || (i === fullStars && hasHalf) ? '#f59e0b' : '#d1d5db' }}>
            ★
          </span>
        ))}
        <span style={{ fontSize: 48, fontWeight: 700, color: '#111827', marginLeft: 16 }}>{rating}</span>
      </div>
      {/* Review count */}
      <div style={{ display: 'flex', fontSize: 24, color: '#6b7280' }}>
        {subject.review_count} reviews
      </div>
      {/* Branding */}
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 20, color: '#9ca3af' }}>
        Ratings
      </div>
    </div>,
    { ...size }
  )
}
```

- [ ] **Step 2: Update Subject page generateMetadata**

In `src/app/[locale]/subject/[id]/page.tsx`, update the `generateMetadata` function to add OG and Twitter metadata:

```typescript
return {
  title: `${name} (${rating}) — Ratings`,
  description: `Reviews and ratings for ${name}`,
  openGraph: {
    title: `${name} — ${rating} ★`,
    description: `${name} has ${rating} average rating on Ratings`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${name} — ${rating} ★`,
  },
}
```

(The `opengraph-image.tsx` file in the same route segment is automatically picked up by Next.js.)

- [ ] **Step 3: Verify build**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/subject/[id]/opengraph-image.tsx" "src/app/[locale]/subject/[id]/page.tsx"
git commit -m "feat: add dynamic OG image for subject pages"
```

---

### Task 10: Create Profile OG image route

**Files:**
- Create: `src/app/[locale]/profile/[userId]/opengraph-image.tsx`
- Modify: `src/app/[locale]/profile/[userId]/page.tsx`

- [ ] **Step 1: Write the Profile OG image route**

Similar to subject but showing: nickname, level badge color, review count, avatar placeholder.

```tsx
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'User Profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const levelColors: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  platinum: '#818cf8',
}

export default async function Image({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('nickname, level, review_count')
    .eq('id', userId)
    .single()

  const nickname = profile?.nickname ?? 'User'
  const level = profile?.level ?? 'bronze'
  const reviewCount = profile?.review_count ?? 0
  const initial = nickname.charAt(0).toUpperCase()
  const color = levelColors[level] ?? '#6366f1'

  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', backgroundColor: 'white', padding: 60,
    }}>
      {/* Avatar placeholder */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: color, marginBottom: 24,
      }}>
        <span style={{ fontSize: 56, fontWeight: 700, color: 'white' }}>{initial}</span>
      </div>
      {/* Nickname */}
      <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        {nickname}
      </div>
      {/* Level */}
      <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color, textTransform: 'capitalize', marginBottom: 16 }}>
        {level}
      </div>
      {/* Review count */}
      <div style={{ display: 'flex', fontSize: 24, color: '#6b7280' }}>
        {reviewCount} reviews
      </div>
      {/* Branding */}
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 20, color: '#9ca3af' }}>
        Ratings
      </div>
    </div>,
    { ...size }
  )
}
```

- [ ] **Step 2: Update Profile page generateMetadata**

In `src/app/[locale]/profile/[userId]/page.tsx`, update `generateMetadata` to include OG/Twitter meta:

```typescript
return {
  title: `${nickname} — Ratings`,
  description: `${nickname}'s profile on Ratings`,
  openGraph: {
    title: `${nickname} — Ratings`,
    description: `${nickname} has ${reviewCount} reviews on Ratings`,
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${nickname} — Ratings`,
  },
}
```

(Need to fetch `review_count` in the metadata function — expand the select query.)

- [ ] **Step 3: Verify build**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/profile/[userId]/opengraph-image.tsx" "src/app/[locale]/profile/[userId]/page.tsx"
git commit -m "feat: add dynamic OG image for profile pages"
```

---

## Chunk 4: Comparison Page

### Task 11: Create CompareCard component

**Files:**
- Create: `src/components/compare/CompareCard.tsx`

- [ ] **Step 1: Write CompareCard**

Client component showing a single subject column for comparison:

```typescript
interface CompareCardProps {
  subject: {
    id: string
    name: Record<string, string>
    image_url: string | null
    avg_rating: number | null
    review_count: number
  }
  criteria: Array<{ key: string; ko: string; en: string }>
  avgSubRatings: Record<string, number>
  highlightKeys: string[]  // criteria keys where this subject is the winner
  locale: string
  onRemove: () => void
}
```

Layout:
- Subject image or placeholder (gradient with initial letter, same style as subject page)
- Subject name (linked to subject page)
- Overall rating with StarRating component + number
- Review count
- Sub-rating bars: for each criterion, horizontal bar (width proportional to rating/5), green accent if in `highlightKeys`
- Remove button (X) top-right corner

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/compare/CompareCard.tsx
git commit -m "feat: add CompareCard component for comparison view"
```

---

### Task 12: Create SubjectPicker component

**Files:**
- Create: `src/components/compare/SubjectPicker.tsx`

- [ ] **Step 1: Write SubjectPicker**

Client component — a modal dialog for searching and selecting subjects:

```typescript
interface SubjectPickerProps {
  categoryId: string | null    // null = no category lock yet
  onSelect: (subject: { id: string; name: Record<string, string>; image_url: string | null; avg_rating: number | null; review_count: number; category_id: string }) => void
  onClose: () => void
  excludeIds: string[]
}
```

Behavior:
- Fixed overlay with centered modal (max-w-md)
- Search input at top with debounced query (300ms)
- Queries `subjects` table via Supabase client, filtered by `categoryId` if set
- Results list with subject name, rating, review count
- Click selects and calls `onSelect`, then `onClose`
- ESC key or click backdrop calls `onClose`
- Show "same category only" note if categoryId is locked

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/compare/SubjectPicker.tsx
git commit -m "feat: add SubjectPicker modal for comparison subject selection"
```

---

### Task 13: Create Compare page

**Files:**
- Create: `src/app/[locale]/compare/page.tsx`

- [ ] **Step 1: Write Compare page**

Client component that:

1. Reads `ids` from URL search params
2. Manages state: `subjects[]`, `pickerOpen`, `categoryId` (locked after first add)
3. On mount / when ids change, fetches subject data + category criteria + avgSubRatings for each
4. Computes `highlightKeys` per subject (which criteria they "win" — highest rating)
5. Renders:
   - Title "Compare"
   - Grid of CompareCards (flex, gap-4)
   - "Add Subject" button if < 3 subjects (opens SubjectPicker)
   - Empty state if no subjects
6. When subject added/removed, updates URL search params via `router.replace`

Sub-rating average calculation per subject:
```typescript
async function fetchSubRatings(subjectId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('sub_ratings')
    .eq('subject_id', subjectId)

  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}
  for (const review of reviews ?? []) {
    const sr = review.sub_ratings as Record<string, number> | null
    if (!sr) continue
    for (const [key, val] of Object.entries(sr)) {
      sums[key] = (sums[key] ?? 0) + val
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  const avg: Record<string, number> = {}
  for (const key of Object.keys(sums)) {
    avg[key] = Math.round((sums[key] / counts[key]) * 10) / 10
  }
  return avg
}
```

Responsive layout:
- Desktop (md+): `grid grid-cols-2` or `grid-cols-3` based on subject count
- Mobile: `grid grid-cols-2`, 3rd subject via horizontal scroll (`overflow-x-auto`)

- [ ] **Step 2: Verify build**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/compare/page.tsx"
git commit -m "feat: add comparison page with multi-subject side-by-side view"
```

---

### Task 14: Add Compare entry points

**Files:**
- Modify: `src/app/[locale]/subject/[id]/page.tsx`
- Modify: `src/app/[locale]/category/[slug]/page.tsx`

- [ ] **Step 1: Add Compare button to Subject page**

In `src/app/[locale]/subject/[id]/page.tsx`, after the "Write Review" link (around line 173), add:

```tsx
<Link
  href={`/${locale}/compare?ids=${id}`}
  className="inline-flex items-center gap-2 border border-indigo-200 text-indigo-600 rounded-full px-6 py-3 hover:bg-indigo-50 transition-all text-sm font-semibold"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
  Compare
</Link>
```

- [ ] **Step 2: Add Compare link to Category page**

In `src/app/[locale]/category/[slug]/page.tsx`, in the "Top Subjects" section header (line 81), add a compare link:

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="text-base font-semibold text-gray-700">Top Subjects</h2>
  <Link
    href={`/${locale}/compare`}
    className="text-xs text-indigo-500 hover:underline font-medium"
  >
    Compare →
  </Link>
</div>
```

- [ ] **Step 3: Verify build**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/subject/[id]/page.tsx" "src/app/[locale]/category/[slug]/page.tsx"
git commit -m "feat: add Compare entry points to subject and category pages"
```

---

## Chunk 5: Final Integration & Verification

### Task 15: Full build and manual verification

- [ ] **Step 1: Run full build**

```bash
cd "C:/Users/USER/Documents/Projects/my dream/Ratings"
npx next build
```

Expected: Build succeeds with all new routes visible in the output.

- [ ] **Step 2: Verify new routes appear in build output**

Check for:
- `ƒ /[locale]/compare`
- `ƒ /[locale]/subject/[id]/opengraph-image`
- `ƒ /[locale]/profile/[userId]/opengraph-image`

- [ ] **Step 3: Start dev server and smoke test**

```bash
npx next dev
```

Manual checks:
- Visit `/ko/compare` — empty state renders, "Add Subject" button works
- Visit a subject page — "Compare" button visible next to "Write Review"
- Visit a category page — "Compare →" link visible in Top Subjects header
- Visit `/ko/subject/{id}` — Photos section appears if images exist
- Open browser DevTools → Elements → check `<meta property="og:image">` on subject page

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: Phase 1 integration fixes"
```
