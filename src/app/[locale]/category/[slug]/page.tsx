import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { displayRating } from '@/lib/utils/rating'
import ReviewList from '@/components/review/ReviewList'
import { CategoryIcon } from '@/lib/icons'
import PlaceSearch from '@/components/places/PlaceSearch'
import AddSubjectButton from '@/components/category/AddSubjectButton'
import SubjectImage from '@/components/subject/SubjectImage'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: category, error: categoryMetaError } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .single()
  if (categoryMetaError) console.error('[CategoryPage] category metadata query error:', categoryMetaError.message)

  if (!category) return {}

  const name =
    typeof category.name === 'object' && category.name !== null
      ? (category.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (category.name as { ko: string; en: string }).en
      : String(category.name)

  return { title: `${name} — Ratings` }
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .eq('slug', slug)
    .single()
  if (categoryError) console.error('[CategoryPage] category query error:', categoryError.message)

  if (!category) notFound()

  const categoryName =
    typeof category.name === 'object' && category.name !== null
      ? (category.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (category.name as { ko: string; en: string }).en
      : String(category.name)

  const { data: topSubjects, error: topSubjectsError } = await supabase
    .from('subjects')
    .select('id, name, description, avg_rating, review_count, image_url')
    .eq('category_id', category.id)
    .gt('review_count', 0)
    .order('avg_rating', { ascending: false, nullsFirst: false })
    .limit(10)
  if (topSubjectsError) console.error('[CategoryPage] top subjects query error:', topSubjectsError.message)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Category Header Banner */}
      <div className="mb-6 rounded-xl border border-border bg-card px-5 py-6 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <CategoryIcon name={category.icon as string ?? 'folder'} className="size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Do! Ratings!
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{categoryName}</h1>
          </div>
        </div>
      </div>

      {/* Google Places Search - only for places and restaurants */}
      {(category.slug === 'places' || category.slug === 'restaurants') && (
        <PlaceSearch categorySlug={category.slug as 'places' | 'restaurants'} locale={locale} />
      )}

      {/* Top Subjects */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground/80">{locale === 'ko' ? '평가가 쌓인 대상' : 'Rated Subjects'}</h2>
          <div className="flex items-center gap-3">
            <AddSubjectButton categorySlug={slug} locale={locale} />
            <Link
              href={`/${locale}/compare`}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-medium text-primary hover:underline"
            >
              {locale === 'ko' ? '비교 →' : 'Compare →'}
            </Link>
          </div>
        </div>
        {!topSubjects || topSubjects.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground mb-1">{locale === 'ko' ? '좋은 곳을 알고 계신가요?' : 'Know a great place?'}</p>
            <p className="text-sm text-muted-foreground">{locale === 'ko' ? '첫 번째 리뷰어가 되어보세요!' : 'Be the first to review!'}</p>
          </div>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2">
            {topSubjects.map((subject, index) => {
              const subjectName =
                typeof subject.name === 'object' && subject.name !== null
                  ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
                  : String(subject.name)

              return (
                <li key={subject.id}>
                  <Link
                    href={`/${locale}/subject/${subject.id}`}
                    className="group flex min-h-28 items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    <SubjectImage src={subject.image_url as string | null} name={subjectName} className="size-20 shrink-0 rounded-lg" sizes="80px" />
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                        {subjectName}
                      </span>
                      <span className="mt-1 block text-sm font-semibold text-primary">
                        ★ {displayRating(subject.avg_rating)} <span className="text-xs font-normal text-muted-foreground">/10</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {subject.review_count} {locale === 'ko' ? '개 리뷰' : subject.review_count === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* Latest Reviews */}
      <section>
        <h2 className="text-base font-semibold text-foreground/80 mb-3">{locale === 'ko' ? `${categoryName} 최신 리뷰` : `Latest ${categoryName} Reviews`}</h2>
        <ReviewList categoryId={category.id} />
      </section>
    </div>
  )
}
