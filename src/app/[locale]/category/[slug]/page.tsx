import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'
import ReviewList from '@/components/review/ReviewList'
import { CategoryIcon } from '@/lib/icons'
import PlaceSearch from '@/components/places/PlaceSearch'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!category) return {}

  const name =
    typeof category.name === 'object' && category.name !== null
      ? (category.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (category.name as { ko: string; en: string }).en
      : String(category.name)

  return { title: `${name} — Ratings` }
}

const rankStyles = [
  { badge: 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white', row: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-100' },
  { badge: 'bg-gradient-to-r from-gray-300 to-slate-400 text-white', row: 'bg-gradient-to-r from-gray-50 to-slate-100 border-gray-200' },
  { badge: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white', row: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100' },
]

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const categoryName =
    typeof category.name === 'object' && category.name !== null
      ? (category.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (category.name as { ko: string; en: string }).en
      : String(category.name)

  const { data: topSubjects } = await supabase
    .from('subjects')
    .select('id, name, avg_rating, review_count')
    .eq('category_id', category.id)
    .order('avg_rating', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 mb-6 flex flex-col items-center text-center border border-indigo-100">
        <div className="mb-4 text-indigo-600">
          <CategoryIcon name={category.icon as string ?? ''} className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
      </div>

      {/* Google Places Search - only for places and restaurants */}
      {(category.slug === 'places' || category.slug === 'restaurants') && (
        <PlaceSearch categorySlug={category.slug as 'places' | 'restaurants'} locale={locale} />
      )}

      {/* Top Subjects */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Top Subjects</h2>
        {!topSubjects || topSubjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <p className="text-sm font-medium text-gray-600 mb-1">Know a great place?</p>
            <p className="text-sm text-gray-400">Be the first to review!</p>
          </div>
        ) : (
          <ol className="space-y-2 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
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
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors"
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${style ? style.badge : 'bg-indigo-100 text-indigo-700'}`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                      {subjectName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-yellow-500">
                        ★ {formatRating(subject.avg_rating)}
                      </span>
                      <span className="text-xs text-gray-400">({subject.review_count})</span>
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
        <h2 className="text-base font-semibold text-gray-700 mb-3">Latest Reviews</h2>
        <ReviewList />
      </section>
    </div>
  )
}
