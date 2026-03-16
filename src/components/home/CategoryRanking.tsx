import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'

interface CategoryRankingProps {
  locale: string
}

export default async function CategoryRanking({ locale }: CategoryRankingProps) {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (!categories || categories.length === 0) return null

  const categoryData = await Promise.all(
    categories.map(async (category) => {
      const { data: topSubjects } = await supabase
        .from('subjects')
        .select('id, name, avg_rating, review_count')
        .eq('category_id', category.id)
        .order('avg_rating', { ascending: false })
        .limit(5)

      const catName =
        typeof category.name === 'object' && category.name !== null
          ? (category.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (category.name as { ko: string; en: string }).en
          : String(category.name)

      return {
        id: category.id,
        slug: category.slug as string,
        name: catName,
        subjects: topSubjects ?? [],
      }
    })
  )

  return (
    <section className="px-4 py-2 space-y-8">
      {categoryData.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">{category.name}</h2>
            <Link
              href={`/${locale}/category/${category.slug}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              See all
            </Link>
          </div>

          {category.subjects.length === 0 ? (
            <p className="text-sm text-gray-400">No subjects yet</p>
          ) : (
            <ol className="space-y-2">
              {category.subjects.map((subject, index) => {
                const subjectName =
                  typeof subject.name === 'object' && subject.name !== null
                    ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
                    : String(subject.name)

                return (
                  <li key={subject.id}>
                    <Link
                      href={`/${locale}/subject/${subject.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                        {subjectName}
                      </span>
                      <span className="text-sm font-semibold text-yellow-500 shrink-0">
                        ★ {formatRating(subject.avg_rating)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      ))}
    </section>
  )
}
