import { createClient } from '@/lib/supabase/server'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import Link from 'next/link'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface LocalizedText {
  [key: string]: string
}

interface CategoryRecord {
  id: string
  slug: string
  name: LocalizedText
  icon: string | null
}

interface SubjectCategoryRecord {
  slug: string
  name: LocalizedText
  icon: string | null
}

interface SubjectRecord {
  id: string
  name: LocalizedText
  description: LocalizedText | null
  avg_rating: number | null
  review_count: number
  category_id: string
  categories: SubjectCategoryRecord | SubjectCategoryRecord[] | null
}

function pickRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  const categoryOrder = ['people', 'places', 'companies', 'restaurants', 'airlines', 'hotels']

  // Fetch all data in parallel
  const [
    { data: categories },
    { data: allSubjects },
    { data: recentReviews },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('subjects').select('id, name, avg_rating, review_count, description, category_id, categories(slug, name, icon)').limit(100),
    supabase.from('reviews').select('id, title, overall_rating, created_at, subjects(name, categories(name))').order('created_at', { ascending: false }).limit(5),
  ])

  const cats = ((categories ?? []) as CategoryRecord[]).sort((a, b) => {
    const ai = categoryOrder.indexOf(a.slug as string)
    const bi = categoryOrder.indexOf(b.slug as string)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  const subjects = (allSubjects ?? []) as SubjectRecord[]

  // Map subjects with category info
  const mappedSubjects = subjects.map((subject) => {
    const category = pickRelation(subject.categories)

    return {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      avg_rating: subject.avg_rating,
      review_count: subject.review_count,
      category_id: subject.category_id,
      category_slug: category?.slug ?? '',
      category_name: category?.name ?? {},
      category_icon: category?.icon ?? 'folder',
    }
  })

  // Featured: top subjects by review count (for carousel)
  const featured = [...mappedSubjects]
    .sort((a, b) => (
      b.review_count - a.review_count ||
      (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
      a.id.localeCompare(b.id)
    ))
    .slice(0, 8)

  // Spotlight subjects are selected deterministically to keep server renders pure.
  const spotlights = [...mappedSubjects]
    .sort((a, b) => (
      (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
      b.review_count - a.review_count ||
      a.id.localeCompare(b.id)
    ))
    .slice(0, 3)

  // Group subjects by category
  const subjectsByCategory: Record<string, typeof mappedSubjects> = {}
  for (const s of mappedSubjects) {
    if (!subjectsByCategory[s.category_id]) subjectsByCategory[s.category_id] = []
    subjectsByCategory[s.category_id].push(s)
  }

  const totalSubjects = subjects.length
  const totalCategories = cats.length
  const totalReviews = (recentReviews ?? []).length

  return (
    <div className="px-4 py-4 space-y-6">
      {/* 1. Featured Carousel */}
      <FeaturedCarousel subjects={featured.map(s => ({
        id: s.id,
        name: s.name,
        avg_rating: s.avg_rating,
        review_count: s.review_count,
        category_slug: s.category_slug,
        category_name: s.category_name,
        category_icon: s.category_icon,
      }))} locale={locale} />

      {/* 2. Quick Stats Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white text-center">
          <p className="text-2xl font-bold">{totalSubjects}</p>
          <p className="text-xs text-white/70 mt-1">{locale === 'ko' ? '등록된 대상' : 'Subjects'}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white text-center">
          <p className="text-2xl font-bold">{totalCategories}</p>
          <p className="text-xs text-white/70 mt-1">{locale === 'ko' ? '카테고리' : 'Categories'}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white text-center">
          <p className="text-2xl font-bold">{totalReviews}</p>
          <p className="text-xs text-white/70 mt-1">{locale === 'ko' ? '리뷰' : 'Reviews'}</p>
        </div>
      </div>

      {/* 3. Spotlight: "어떻게 생각하세요?" */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-lg">💬</span>
          {locale === 'ko' ? '이 대상에 대해 어떻게 생각하세요?' : 'What do you think about...?'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {spotlights.map(subject => {
            const name = subject.name[locale] ?? subject.name['ko']
            const desc = subject.description?.[locale] ?? subject.description?.['ko'] ?? ''
            const catName = subject.category_name[locale] ?? subject.category_name['ko']
            return (
              <Link key={subject.id} href={`/${locale}/subject/${subject.id}`}
                className="relative bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition-all group overflow-hidden">
                {/* Category color top accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${getCategoryColor(subject.category_slug)}`} />
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={`w-5 h-5 rounded-full ${getCategoryColor(subject.category_slug)} flex items-center justify-center`}>
                    <CategoryIcon name={subject.category_icon} className="w-3 h-3 text-white" />
                  </span>
                  <span className="text-xs text-gray-400">r/{catName}</span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-lg mb-1">{name}</h3>
                {desc && <p className="text-xs text-gray-500 line-clamp-1 mb-3">{desc}</p>}
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-3 py-1">
                  {locale === 'ko' ? '평가하기 →' : 'Rate now →'}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 4. Category Showcase - each category with its subjects */}
      {cats.map(cat => {
        const catSubjects = subjectsByCategory[cat.id] ?? []
        if (catSubjects.length === 0) return null
        const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
        const slug = cat.slug as string
        const icon = (cat.icon ?? 'folder') as string

        return (
          <section key={cat.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full ${getCategoryColor(slug)} flex items-center justify-center`}>
                  <CategoryIcon name={icon} className="w-4 h-4 text-white" />
                </span>
                {catName}
                <span className="text-xs font-normal text-gray-400 ml-1">({catSubjects.length})</span>
              </h2>
              <Link href={`/${locale}/category/${slug}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                {locale === 'ko' ? '모두 보기' : 'See all'}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            </div>

            {/* Horizontal scroll of subject cards */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {catSubjects.slice(0, 10).map((subject, index) => {
                const name = subject.name[locale] ?? subject.name['ko']
                const desc = subject.description?.[locale] ?? subject.description?.['ko'] ?? ''
                return (
                  <Link key={subject.id} href={`/${locale}/subject/${subject.id}`}
                    className="shrink-0 w-44 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    {/* Color header based on category */}
                    <div className={`h-16 ${getCategoryColor(slug)} opacity-80 flex items-center justify-center relative`}>
                      <CategoryIcon name={icon} className="w-8 h-8 text-white/40" />
                      {index < 3 && (
                        <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-white' : 'bg-amber-600 text-white'
                        }`}>{index + 1}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{name}</h4>
                      {desc && <p className="text-xs text-gray-400 truncate mt-0.5">{desc}</p>}
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        {subject.avg_rating ? (
                          <span className="text-yellow-500 font-medium">★ {subject.avg_rating.toFixed(1)}</span>
                        ) : (
                          <span className="text-gray-300">{locale === 'ko' ? '평점 없음' : 'No rating'}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* 5. CTA Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-center text-white">
        <h2 className="text-xl font-bold mb-2">
          {locale === 'ko' ? '당신의 의견을 들려주세요' : 'Share Your Opinion'}
        </h2>
        <p className="text-sm text-white/80 mb-4">
          {locale === 'ko' ? '첫 번째 리뷰어가 되어 다른 사람들에게 도움을 주세요!' : 'Be the first reviewer and help others!'}
        </p>
        <Link href={`/${locale}/explore`}
          className="inline-block bg-white text-indigo-600 font-bold px-6 py-2.5 rounded-full hover:shadow-lg transition-all hover:scale-105 text-sm">
          {locale === 'ko' ? '탐색하기' : 'Explore Now'}
        </Link>
      </div>
    </div>
  )
}
