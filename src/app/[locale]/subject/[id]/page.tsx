import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'
import StarRating from '@/components/review/StarRating'
import SubRatingChart from '@/components/review/SubRatingChart'
import ReviewList from '@/components/review/ReviewList'

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('name, avg_rating')
    .eq('id', id)
    .single()

  if (!subject) return {}

  const name =
    typeof subject.name === 'object' && subject.name !== null
      ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
      : String(subject.name)

  const rating = formatRating(subject.avg_rating)

  return {
    title: `${name} (${rating}) — Ratings`,
    description: `Reviews and ratings for ${name}`,
  }
}

export default async function SubjectPage({ params }: PageProps) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      image_url,
      avg_rating,
      review_count,
      category_id,
      categories!inner(id, name, slug, sub_rating_criteria)
    `)
    .eq('id', id)
    .single()

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

  const criteria: Array<{ key: string; ko: string; en: string }> =
    Array.isArray(category?.sub_rating_criteria) ? category.sub_rating_criteria : []

  // Compute average sub_ratings server-side
  let avgSubRatings: Record<string, number> = {}
  if (criteria.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('sub_ratings')
      .eq('subject_id', id)

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

  // Check if current user already reviewed (server-side via cookie session)
  const { data: { user } } = await supabase.auth.getUser()
  let existingReviewId: string | null = null
  if (user) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('subject_id', id)
      .eq('user_id', user.id)
      .single()
    existingReviewId = existingReview?.id ?? null
  }

  const writeHref = `/${locale}/write/${id}`

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Subject Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-4">
          {subject.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={subject.image_url as string}
              alt={subjectName}
              className="w-20 h-20 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <Link
              href={`/${locale}/category/${category?.slug ?? ''}`}
              className="text-xs text-indigo-500 font-medium hover:underline"
            >
              {categoryName}
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5 mb-2">{subjectName}</h1>
            <div className="flex items-center gap-2">
              <StarRating value={subject.avg_rating ?? 0} readonly size="lg" />
              <span className="text-lg font-semibold text-gray-700">
                {formatRating(subject.avg_rating)}
              </span>
              <span className="text-sm text-gray-400">({subject.review_count} reviews)</span>
            </div>
          </div>
        </div>

        {/* Sub Rating Chart */}
        {criteria.length > 0 && Object.keys(avgSubRatings).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <SubRatingChart criteria={criteria} values={avgSubRatings} locale={locale} />
          </div>
        )}

        {/* Write Review Button */}
        <div className="mt-4">
          <Link
            href={writeHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {existingReviewId ? 'Edit Review' : 'Write Review'}
          </Link>
        </div>
      </div>

      {/* Reviews */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Reviews</h2>
        <ReviewList subjectId={id} locale={locale} />
      </section>
    </div>
  )
}
