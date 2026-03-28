import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRating } from '@/lib/utils/rating'
import { CategoryIcon } from '@/lib/icons'

interface CategoryRankingProps {
  locale: string
}

const medalRowConfig = [
  { className: 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' },
  { className: 'bg-gradient-to-r from-gray-50 to-slate-50 border border-border' },
  { className: 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200' },
]

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

  const seeAllLabel = locale === 'ko' ? '모두 보기' : 'See all'
  const noSubjectsLabel = locale === 'ko' ? '아직 등록된 항목이 없습니다' : 'No subjects yet'
  const noSubjectsCta = locale === 'ko' ? '첫 번째로 리뷰를 남겨보세요!' : 'Be the first to add a review!'

  return (
    <section className="px-4 py-2 space-y-8">
      {categoryData.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CategoryIcon name={category.slug} className="w-5 h-5 text-indigo-500" />
              {category.name}
            </h2>
            <Link
              href={`/${locale}/category/${category.slug}`}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
            >
              {seeAllLabel}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          {category.subjects.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <svg className="w-12 h-12 text-muted-foreground/40 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <p className="text-sm font-medium text-muted-foreground mb-1">{noSubjectsLabel}</p>
              <p className="text-xs text-muted-foreground/60">{noSubjectsCta}</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {category.subjects.map((subject, index) => {
                const subjectName =
                  typeof subject.name === 'object' && subject.name !== null
                    ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
                    : String(subject.name)

                const rowStyle = index < 3 ? medalRowConfig[index].className : ''

                return (
                  <li key={subject.id}>
                    <Link
                      href={`/${locale}/subject/${subject.id}`}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors ${rowStyle}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {subjectName}
                      </span>
                      <span className="flex items-center gap-0.5 text-sm font-semibold text-yellow-500 shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {formatRating(subject.avg_rating)}
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
