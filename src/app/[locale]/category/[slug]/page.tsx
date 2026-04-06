import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'
import ReviewList from '@/components/review/ReviewList'
import { CategoryIcon } from '@/lib/icons'
import PlaceSearch from '@/components/places/PlaceSearch'
import AddSubjectButton from '@/components/category/AddSubjectButton'
import AutoScrollRow from '@/components/home/AutoScrollRow'

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

const rankStyles = [
  { badge: 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white', row: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-100' },
  { badge: 'bg-gradient-to-r from-gray-300 to-slate-400 text-white', row: 'bg-gradient-to-r from-gray-50 to-slate-100 border-border' },
  { badge: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white', row: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100' },
]

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
    .order('avg_rating', { ascending: false })
    .limit(10)
  if (topSubjectsError) console.error('[CategoryPage] top subjects query error:', topSubjectsError.message)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Category Header Banner */}
      <div className="bg-primary/5 rounded-2xl p-8 mb-6 flex flex-col items-center text-center border border-primary/20">
        <div className="mb-4 text-primary">
          <CategoryIcon name={category.icon as string ?? ''} className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{categoryName}</h1>
      </div>

      {/* Google Places Search - only for places and restaurants */}
      {(category.slug === 'places' || category.slug === 'restaurants') && (
        <PlaceSearch categorySlug={category.slug as 'places' | 'restaurants'} locale={locale} />
      )}

      {/* Auto Scroll Row — popular subjects carousel */}
      {topSubjects && topSubjects.length >= 3 && (
        <section className="mb-6">
          <h2 className="font-display text-base font-bold tracking-tight text-foreground mb-3">
            {locale === 'ko' ? `인기 ${categoryName}` : `Popular ${categoryName}`}
          </h2>
          <AutoScrollRow
            subjects={topSubjects.map(s => ({
              id: s.id,
              name: s.name as Record<string, string>,
              description: (s.description ?? null) as Record<string, string> | null,
              avg_rating: s.avg_rating,
              review_count: s.review_count,
              image_url: s.image_url as string | null,
            }))}
            categorySlug={slug}
            categoryIcon={category.icon as string ?? 'folder'}
            locale={locale}
          />
        </section>
      )}

      {/* Top Subjects */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground/80">{locale === 'ko' ? '인기 대상' : 'Top Subjects'}</h2>
          <div className="flex items-center gap-3">
            <AddSubjectButton categorySlug={slug} locale={locale} />
            <Link
              href={`/${locale}/compare`}
              className="text-xs text-primary hover:underline font-medium"
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
          <ol className="space-y-2 bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
            {topSubjects.map((subject, index) => {
              const subjectName =
                typeof subject.name === 'object' && subject.name !== null
                  ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
                  : String(subject.name)

              const style = index < 3 ? rankStyles[index] : null

              return (
                <li key={subject.id} className={style ? style.row : ''}>
                  <Link
                    href={`/${locale}/subject/${subject.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-card/60 transition-colors"
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${style ? style.badge : 'bg-primary/10 text-primary'}`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {subjectName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        ★ {formatRating(subject.avg_rating)}
                      </span>
                      <span className="text-xs text-muted-foreground">({subject.review_count})</span>
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
        <h2 className="text-base font-semibold text-foreground/80 mb-3">{locale === 'ko' ? '최신 리뷰' : 'Latest Reviews'}</h2>
        <ReviewList />
      </section>
    </div>
  )
}
