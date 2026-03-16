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
      <h2 className="text-lg font-bold text-gray-900 mb-4">Trending</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((subject) => {
          const subjectName =
            typeof subject.name === 'object' && subject.name !== null
              ? (subject.name as { ko: string; en: string })[locale as 'ko' | 'en'] ?? (subject.name as { ko: string; en: string }).en
              : String(subject.name)

          const category = subject.categories as unknown as { name: { ko: string; en: string }; slug: string } | null
          const categoryName = category
            ? (category.name[locale as 'ko' | 'en'] ?? category.name.en)
            : ''

          return (
            <Link
              key={subject.id}
              href={`/${locale}/subject/${subject.id}`}
              className="shrink-0 w-44 bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-indigo-500 font-medium mb-1 truncate">{categoryName}</p>
              <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{subjectName}</h3>
              <div className="flex items-center gap-1.5">
                <StarRating value={subject.avg_rating ?? 0} readonly size="sm" />
                <span className="text-xs text-gray-500">({subject.review_count})</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
