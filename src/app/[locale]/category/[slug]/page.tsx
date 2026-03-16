import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'
import ReviewList from '@/components/review/ReviewList'

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
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-6">
        {category.icon && (
          <span className="text-3xl">{category.icon as string}</span>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
      </div>

      {/* Top Subjects */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Top Subjects</h2>
        {!topSubjects || topSubjects.length === 0 ? (
          <p className="text-sm text-gray-400">No subjects yet</p>
        ) : (
          <ol className="space-y-2 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {topSubjects.map((subject, index) => {
              const subjectName =
                typeof subject.name === 'object' && subject.name !== null
                  ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
                  : String(subject.name)

              return (
                <li key={subject.id}>
                  <Link
                    href={`/${locale}/subject/${subject.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
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
        <ReviewList locale={locale} />
      </section>
    </div>
  )
}
