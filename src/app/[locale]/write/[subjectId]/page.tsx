import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReviewForm from '@/components/review/ReviewForm'

interface PageProps {
  params: Promise<{ locale: string; subjectId: string }>
}

export default async function WriteReviewPage({ params }: PageProps) {
  const { locale, subjectId } = await params
  const supabase = await createClient()

  // Require auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Fetch subject with category criteria
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

  // Check for existing review
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, title, content, sub_ratings, overall_rating')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .single()

  const isEditing = !!existingReview

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

      <ReviewForm
        subjectId={subjectId}
        criteria={criteria}
        locale={locale}
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
