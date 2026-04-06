import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'
import { proxyImageUrl } from '@/lib/utils/image-proxy'
import AnimatedRating from '@/components/ui/AnimatedRating'
import StarRating from '@/components/review/StarRating'
import SubRatingChart from '@/components/review/SubRatingChart'
import RelatedNews from '@/components/news/RelatedNews'
import ImageAttribution from '@/components/ui/ImageAttribution'
import SubjectTabs from '@/components/subject/SubjectTabs'
import SubjectEditor from '@/components/subject/SubjectEditor'
import ShareMenu from '@/components/ui/ShareMenu'
import ClaimButton from '@/components/business/ClaimButton'
import AddToCollectionButton from '@/components/collection/AddToCollectionButton'
import SentimentRiver from '@/components/subject/SentimentRiver'
import FaultlineFeed from '@/components/subject/FaultlineFeed'
import SevenSecondCollapse from '@/components/subject/SevenSecondCollapse'
import GhostReviews from '@/components/home/GhostReviews'

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: subject, error: subjectMetaError } = await supabase
    .from('subjects')
    .select('name, avg_rating')
    .eq('id', id)
    .single()
  if (subjectMetaError) console.error('[SubjectPage] subject metadata query error:', subjectMetaError.message)

  if (!subject) return {}

  const name =
    typeof subject.name === 'object' && subject.name !== null
      ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
      : String(subject.name)

  const rating = formatRating(subject.avg_rating)

  const desc = locale === 'ko'
    ? `${name}에 대한 솔직한 리뷰와 별점을 확인하세요. 평균 ${rating}점`
    : `Read honest reviews and ratings for ${name}. Average ${rating} stars`

  return {
    title: `${name} ${rating} ★ — Do! Ratings!`,
    description: desc,
    openGraph: {
      title: `${name} — ${rating} ★`,
      description: desc,
      type: 'website',
      url: `https://do-ratings.com/${locale}/subject/${id}`,
      siteName: 'Do! Ratings!',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — ${rating} ★`,
      description: desc,
    },
    alternates: {
      canonical: `https://do-ratings.com/${locale}/subject/${id}`,
      languages: { ko: `https://do-ratings.com/ko/subject/${id}`, en: `https://do-ratings.com/en/subject/${id}` },
    },
  }
}

export default async function SubjectPage({ params }: PageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      description,
      image_url,
      avg_rating,
      review_count,
      category_id,
      metadata,
      categories!inner(id, name, slug, sub_rating_criteria)
    `)
    .eq('id', id)
    .single()
  if (subjectError) console.error('[SubjectPage] subject query error:', subjectError.message)

  if (!subject) notFound()

  const subjectName =
    typeof subject.name === 'object' && subject.name !== null
      ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
      : String(subject.name)

  const category = subject.categories as unknown as {
    id: string
    name: { ko: string; en: string }
    slug: string
    sub_rating_criteria: Array<{ key: string; ko: string; en: string }>
  }

  const categoryName = category
    ? (category.name[locale as 'ko' | 'en'] ?? category.name.en)
    : ''

  const subjectDesc =
    typeof subject.description === 'object' && subject.description !== null
      ? ((subject.description as Record<string, string>)[locale] ?? (subject.description as Record<string, string>).en ?? '')
      : ''

  const criteria: Array<{ key: string; ko: string; en: string }> =
    Array.isArray(category?.sub_rating_criteria) ? category.sub_rating_criteria : []

  // Compute average sub_ratings server-side
  const avgSubRatings: Record<string, number> = {}
  if (criteria.length > 0) {
    const { data: reviews, error: subRatingsError } = await supabase
      .from('reviews')
      .select('sub_ratings')
      .eq('subject_id', id)
    if (subRatingsError) console.error('[SubjectPage] sub_ratings query error:', subRatingsError.message)

    if (reviews && reviews.length > 0) {
      const sums: Record<string, number> = {}
      const counts: Record<string, number> = {}
      for (const review of reviews) {
        const sr = review.sub_ratings as Record<string, number> | null
        if (!sr) continue
        for (const key of Object.keys(sr)) {
          sums[key] = (sums[key] ?? 0) + sr[key]
          counts[key] = (counts[key] ?? 0) + 1
        }
      }
      for (const key of Object.keys(sums)) {
        avgSubRatings[key] = Math.round((sums[key] / counts[key]) * 10) / 10
      }
    }
  }

  // Fetch review photos for gallery
  const { data: reviewsWithImages, error: reviewImagesError } = await supabase
    .from('reviews')
    .select('review_images(id, storage_path, display_order)')
    .eq('subject_id', id)
    .limit(20)
  if (reviewImagesError) console.error('[SubjectPage] review_images query error:', reviewImagesError.message)

  type ReviewImageRow = { id: string; storage_path: string; display_order: number }
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/review-images/'
  const allImages = (reviewsWithImages ?? [])
    .flatMap(r => ((r as { review_images: ReviewImageRow[] | null }).review_images) ?? [])
    .slice(0, 12)
    .map((img) => ({ id: img.id, url: storageBase + img.storage_path }))

  // Calculate rank/percentile within category
  const { count: higherCount, error: higherCountError } = await supabase
    .from('subjects')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', subject.category_id)
    .gt('avg_rating', subject.avg_rating ?? 0)
  if (higherCountError) console.error('[SubjectPage] higher count query error:', higherCountError.message)

  const { count: totalInCategory, error: totalCountError } = await supabase
    .from('subjects')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', subject.category_id)
    .not('avg_rating', 'is', null)
  if (totalCountError) console.error('[SubjectPage] total count query error:', totalCountError.message)

  const rank = (higherCount ?? 0) + 1
  const total = totalInCategory ?? 1
  const percentile = Math.round((1 - (rank - 1) / total) * 100)

  // Check if current user already reviewed (server-side via cookie session)
  const { data: { user } } = await supabase.auth.getUser()
  let existingReviewId: string | null = null
  if (user) {
    const { data: existingReview, error: existingReviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('subject_id', id)
      .eq('user_id', user.id)
      .single()
    if (existingReviewError && existingReviewError.code !== 'PGRST116') {
      console.error('[SubjectPage] existing review query error:', existingReviewError.message)
    }
    existingReviewId = existingReview?.id ?? null
  }

  const writeHref = `/${locale}/write/${id}`

  // First letter of subject name for placeholder
  const firstLetter = subjectName.charAt(0).toUpperCase()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: subjectName,
    description: subjectDesc || `${subjectName} — ${categoryName}`,
    ...(subject.image_url ? { image: subject.image_url } : {}),
    ...(subject.avg_rating != null && subject.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(subject.avg_rating).toFixed(1),
        bestRating: '5',
        worstRating: '1',
        ratingCount: subject.review_count,
      }
    } : {}),
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Subject Header Card */}
      <div className="bg-card rounded-xl shadow-sm ring-1 ring-foreground/[0.06] overflow-hidden">
        <div className="px-4 py-6">
          {/* Subject info row */}
          <div className="flex gap-4">
            <div className="shrink-0">
              {subject.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proxyImageUrl(subject.image_url as string) ?? ''}
                  alt={subjectName}
                  className="w-20 h-20 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{firstLetter}</span>
                </div>
              )}
              {/* Image Attribution */}
              {(() => {
                const meta = subject.metadata as Record<string, unknown> | null
                const attr = meta?.image_attribution as { source: string; photographer?: string; url?: string; license?: string } | null
                return attr ? <ImageAttribution attribution={attr} /> : null
              })()}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/${locale}/category/${category?.slug ?? ''}`} className="inline-block px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-md hover:opacity-80">
                {categoryName}
              </Link>
              <h1 className="text-xl font-bold mt-1 mb-1">{subjectName}</h1>
              <div className="mb-2">
                <SubjectEditor
                  subjectId={id}
                  currentDescription={typeof subject.description === 'object' && subject.description !== null ? subject.description as Record<string, string> : null}
                  locale={locale}
                  currentUserId={user?.id ?? null}
                />
              </div>
              <div className="flex items-center gap-2 golden-glow rounded-lg px-2 py-1 inline-flex">
                <StarRating value={subject.avg_rating ?? 0} readonly size="lg" />
                <AnimatedRating value={subject.avg_rating ?? 0} className="text-lg font-semibold text-foreground" />
                {subject.avg_rating && totalInCategory && totalInCategory > 1 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {locale === 'ko' ? `상위 ${percentile}%` : `Top ${percentile}%`}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">({subject.review_count} {locale === 'ko' ? '개 리뷰' : subject.review_count === 1 ? 'review' : 'reviews'})</span>
              </div>
            </div>
          </div>

          {/* Sub Rating Chart */}
          {criteria.length > 0 && Object.keys(avgSubRatings).length > 0 && (
            <>
              <hr className="my-4 border-border" />
              <SubRatingChart criteria={criteria} values={avgSubRatings} locale={locale} />
            </>
          )}

          {/* Sentiment River — review mood over time */}
          <div className="my-4">
            <SentimentRiver subjectId={id} locale={locale} />
          </div>

          {/* Faultline Feed — trembling crack for polarized subjects */}
          <FaultlineFeed subjectId={id} locale={locale} />

          {/* Seven Second Collapse — real-time page explosion on rating shift */}
          <SevenSecondCollapse subjectId={id} previousAvg={subject.avg_rating} locale={locale} />

          <hr className="my-4 border-border" />

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Link href={writeHref} className={`inline-flex items-center gap-1.5 h-9 px-5 text-sm font-semibold rounded-lg transition-all ${
              existingReviewId
                ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                : 'bg-primary text-white shadow-md hover:shadow-lg hover:scale-105'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {existingReviewId
                ? (locale === 'ko' ? '리뷰 수정' : 'Edit Review')
                : (locale === 'ko' ? '리뷰 작성' : 'Write Review')}
            </Link>
            <Link href={`/${locale}/compare?ids=${id}`} className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium border border-border bg-background rounded-lg hover:bg-muted transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {locale === 'ko' ? '비교하기' : 'Compare'}
            </Link>
            <ShareMenu url={`/${locale}/subject/${id}`} title={subjectName} type="subject" locale={locale} />
            <ClaimButton subjectId={id} currentUserId={user?.id ?? null} locale={locale} />
            <AddToCollectionButton subjectId={id} currentUserId={user?.id ?? null} />
          </div>
        </div>
      </div>

      {/* Ghost Reviews — show when no reviews exist */}
      {subject.review_count === 0 && (
        <GhostReviews locale={locale} writeHref={writeHref} />
      )}

      {/* Tabbed content: Reviews, Photos, Trend, AI Summary, Embed */}
      <SubjectTabs
        subjectId={id}
        locale={locale}
        images={allImages}
        subjectName={subjectName}
        avgRating={subject.avg_rating ? Number(subject.avg_rating) : null}
        reviewCount={subject.review_count as number}
      />

      {/* Related News */}
      <RelatedNews
        query={typeof subject.name === 'object' ? ((subject.name as Record<string, string>)['ko'] ?? '') : String(subject.name)}
        locale={locale}
      />
    </div>
  )
}
