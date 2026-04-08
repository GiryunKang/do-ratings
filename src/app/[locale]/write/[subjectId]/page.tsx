import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReviewForm from '@/components/review/ReviewForm'

interface PageProps {
  params: Promise<{ locale: string; subjectId: string }>
  searchParams: Promise<{ rating?: string }>
}

export default async function WriteReviewPage({ params, searchParams }: PageProps) {
  const { locale, subjectId } = await params
  const { rating: ratingParam } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch subject with category criteria (always — even for non-logged-in users)
  const { data: subject } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      categories!inner(id, name, sub_rating_criteria)
    `)
    .eq('id', subjectId)
    .single()

  if (!subject) notFound()

  const subjectName =
    typeof subject.name === 'object' && subject.name !== null
      ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
      : String(subject.name)

  const category = subject.categories as unknown as {
    id: string
    name: { ko: string; en: string }
    sub_rating_criteria: Array<{ key: string; ko: string; en: string }>
  }

  const criteria: Array<{ key: string; ko: string; en: string }> =
    Array.isArray(category?.sub_rating_criteria) ? category.sub_rating_criteria : []

  // Check for existing review (only if logged in)
  let existingReview = null
  if (user) {
    const { data } = await supabase
      .from('reviews')
      .select('id, title, content, sub_ratings, overall_rating')
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)
      .single()
    existingReview = data
  }

  const isEditing = !!existingReview
  const isLoggedIn = !!user

  // Pre-fill rating from QuickRateStars ?rating= query param (only when not editing).
  // QuickRateStars sends rating*2 (1-5 stars → 2-10), ReviewForm uses 1-5 scale,
  // so divide by 2 and clamp to [1, 5].
  const initialRating = !isEditing && ratingParam
    ? Math.min(5, Math.max(1, Math.round(parseInt(ratingParam, 10) / 2)))
    : undefined

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/subject/${subjectId}`}
          className="text-muted-foreground hover:text-muted-foreground transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {isEditing ? (locale === 'ko' ? '리뷰 수정' : 'Edit Review') : (locale === 'ko' ? '리뷰 작성' : 'Write Review')}
          </h1>
          <p className="text-sm text-muted-foreground">{subjectName}</p>
        </div>
      </div>

      {!isLoggedIn && (
        <div className="mb-4 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/20 dark:border-primary/20">
          <p className="text-sm font-medium text-foreground dark:text-primary/30 mb-2">
            {locale === 'ko' ? '로그인하면 리뷰를 저장할 수 있습니다' : 'Sign in to save your review'}
          </p>
          <Link
            href={`/${locale}/auth/login?redirect=/${locale}/write/${subjectId}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            {locale === 'ko' ? '로그인 / 회원가입' : 'Sign in / Sign up'}
          </Link>
        </div>
      )}

      <ReviewForm
        subjectId={subjectId}
        criteria={criteria}
        locale={locale}
        readOnly={!isLoggedIn}
        initialRating={initialRating}
        existingReview={
          existingReview
            ? {
                id: existingReview.id,
                title: existingReview.title,
                content: existingReview.content,
                sub_ratings: (existingReview.sub_ratings as Record<string, number>) ?? {},
                overall_rating: existingReview.overall_rating,
              }
            : undefined
        }
      />
    </div>
  )
}
