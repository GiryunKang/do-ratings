import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/review/StarRating'

interface TrendingSubject {
  id: string
  name: { ko: string; en: string }
  avg_rating: number | null
  review_count: number
  category: {
    name: { ko: string; en: string }
    slug: string
  } | null
}

interface TrendingSubjectsProps {
  locale: string
}

const medalConfig = [
  { bg: 'bg-yellow-400', text: 'text-white' },
  { bg: 'bg-gray-400', text: 'text-white' },
  { bg: 'bg-amber-600', text: 'text-white' },
]

export default async function TrendingSubjects({ locale }: TrendingSubjectsProps) {
  const supabase = await createClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: subjects } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      avg_rating,
      review_count,
      categories!inner(name, slug)
    `)
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('review_count', { ascending: false })
    .limit(10)

  if (!subjects || subjects.length === 0) return null

  return (
    <section className="px-4 py-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span aria-hidden="true">🔥</span>
        {locale === 'ko' ? '지금 뜨는 곳' : 'Trending Now'}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((subject, index) => {
          const subjectName =
            typeof subject.name === 'object' && subject.name !== null
              ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
              : String(subject.name)

          const category = subject.categories as unknown as { name: { ko: string; en: string }; slug: string } | null
          const categoryName = category
            ? (category.name[locale as 'ko' | 'en'] ?? category.name.en)
            : ''

          const medal = index < 3 ? medalConfig[index] : null

          return (
            <Link
              key={subject.id}
              href={`/${locale}/subject/${subject.id}`}
              className="relative shrink-0 w-48 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient top border */}
              <div className="h-1 rounded-t-2xl gradient-primary" />

              {/* Medal badge for top 3 */}
              {medal && (
                <span
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full ${medal.bg} ${medal.text} text-xs font-bold flex items-center justify-center shadow-sm z-10`}
                >
                  {index + 1}
                </span>
              )}

              <div className="p-3">
                <p className="text-xs text-indigo-500 font-medium mb-1 truncate">{categoryName}</p>
                <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{subjectName}</h3>
                <div className="flex items-center gap-1.5">
                  <StarRating value={subject.avg_rating ?? 0} readonly size="sm" />
                  <span className="text-xs text-gray-500">({subject.review_count})</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
