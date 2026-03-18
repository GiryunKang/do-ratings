import { createClient } from '@/lib/supabase/server'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import HeroBanner from '@/components/home/HeroBanner'
import AutoScrollRow from '@/components/home/AutoScrollRow'
import TrendingSection from '@/components/home/TrendingSection'
import PopularReviewsSection from '@/components/home/PopularReviewsSection'
import AnimatedSection from '@/components/ui/AnimatedSection'
import GlowCard from '@/components/ui/GlowCard'
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
  image_url: string | null
  categories: SubjectCategoryRecord | SubjectCategoryRecord[] | null
}

interface TrendingSubject {
  id: string
  name: LocalizedText
  image_url: string | null
  avg_rating: number | null
  review_count: number
  recentCount: number
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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [
    { data: categories },
    { data: allSubjects },
    { data: recentReviews },
    { data: trendingReviews },
    { data: popularReviews },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('subjects').select('id, name, avg_rating, review_count, description, category_id, image_url, categories(slug, name, icon)').limit(200),
    supabase.from('reviews').select('id, title, overall_rating, created_at, subjects(name, categories(name))').order('created_at', { ascending: false }).limit(5),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count, categories(slug, name, icon))').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, created_at, user_id, subject_id, subjects(name, categories(name, slug)), public_profiles(nickname, level, avatar_url)').order('helpful_count', { ascending: false }).limit(5),
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
      image_url: subject.image_url,
      category_slug: category?.slug ?? '',
      category_name: category?.name ?? {},
      category_icon: category?.icon ?? 'folder',
    }
  })

  // Featured: based on weekly review activity, fallback to category-balanced selection
  const weeklyReviewCounts = new Map<string, number>()
  for (const r of (trendingReviews ?? [])) {
    const sid = (r as { subject_id: string }).subject_id
    weeklyReviewCounts.set(sid, (weeklyReviewCounts.get(sid) ?? 0) + 1)
  }

  let featured: typeof mappedSubjects
  if (weeklyReviewCounts.size >= 3) {
    // Use weekly trending subjects
    featured = [...mappedSubjects]
      .sort((a, b) => (
        (weeklyReviewCounts.get(b.id) ?? 0) - (weeklyReviewCounts.get(a.id) ?? 0) ||
        b.review_count - a.review_count ||
        (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
      ))
      .slice(0, 8)
  } else {
    // Fallback: pick evenly from each category (1-2 per category)
    const byCategory = new Map<string, typeof mappedSubjects>()
    for (const s of mappedSubjects) {
      const list = byCategory.get(s.category_slug) ?? []
      list.push(s)
      byCategory.set(s.category_slug, list)
    }
    const balanced: typeof mappedSubjects = []
    for (const slug of categoryOrder) {
      const list = byCategory.get(slug) ?? []
      // Sort within category: review_count then rating then random-ish
      list.sort((a, b) => b.review_count - a.review_count || (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
      balanced.push(...list.slice(0, 2))
    }
    featured = balanced.slice(0, 8)
  }

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

  // Process trending subjects
  const trendingMap = new Map<string, TrendingSubject>()
  for (const r of (trendingReviews ?? [])) {
    const s = pickRelation(r.subjects as any)
    if (!s) continue
    const existing = trendingMap.get(s.id)
    if (existing) {
      existing.recentCount++
    } else {
      trendingMap.set(s.id, {
        id: s.id,
        name: s.name,
        image_url: s.image_url,
        avg_rating: s.avg_rating,
        review_count: s.review_count,
        recentCount: 1,
      })
    }
  }
  const trendingSubjects = [...trendingMap.values()]
    .sort((a, b) => b.recentCount - a.recentCount)
    .slice(0, 6)

  // Process popular reviews
  const topReviews = (popularReviews ?? []).map(r => {
    const subject = pickRelation(r.subjects as any)
    const profile = pickRelation(r.public_profiles as any)
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      overall_rating: r.overall_rating,
      helpful_count: r.helpful_count,
      subject_id: r.subject_id,
      subject_name: (subject?.name ?? {}) as LocalizedText,
      nickname: profile?.nickname ?? 'Anonymous',
    }
  }).filter(r => r.helpful_count > 0)

  return (
    <div className="px-4 py-4 space-y-6">
      {/* 0. Hero Banner - Do! Ratings! */}
      <AnimatedSection delay={0}>
        <HeroBanner locale={locale} />
      </AnimatedSection>

      {/* 1. Featured Carousel */}
      <AnimatedSection delay={0.05}>
        <FeaturedCarousel subjects={featured.map(s => ({
          id: s.id,
          name: s.name,
          avg_rating: s.avg_rating,
          review_count: s.review_count,
          category_slug: s.category_slug,
          category_name: s.category_name,
          category_icon: s.category_icon,
          image_url: s.image_url,
        }))} locale={locale} />
      </AnimatedSection>

      {/* 2. Trending + Popular Reviews (with daily/weekly/monthly tabs) */}
      <AnimatedSection delay={0.1}>
        <TrendingSection locale={locale} />
      </AnimatedSection>

      <AnimatedSection delay={0.12}>
        <PopularReviewsSection locale={locale} />
      </AnimatedSection>

      {/* 3. Quick Stats Banner */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-3 gap-3">
          <GlowCard className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white text-center border-0" glowColor="rgba(129, 140, 248, 0.4)">
            <p className="text-2xl font-bold">{totalSubjects}</p>
            <p className="text-xs text-white/70 mt-1">{locale === 'ko' ? '등록된 대상' : 'Subjects'}</p>
          </GlowCard>
          <GlowCard className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 text-white text-center border-0" glowColor="rgba(244, 114, 182, 0.4)">
            <p className="text-2xl font-bold">{totalCategories}</p>
            <p className="text-xs text-white/70 mt-1">{locale === 'ko' ? '카테고리' : 'Categories'}</p>
          </GlowCard>
          <GlowCard className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white text-center border-0" glowColor="rgba(251, 191, 36, 0.4)">
            <p className="text-2xl font-bold">{totalReviews}</p>
            <p className="text-xs text-white/70 mt-1">{locale === 'ko' ? '리뷰' : 'Reviews'}</p>
          </GlowCard>
        </div>
      </AnimatedSection>

      {/* 5. Spotlight: "어떻게 생각하세요?" */}
      <AnimatedSection delay={0.1}>
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
      </AnimatedSection>

      {/* 6. Category Showcase - each category with its subjects */}
      {cats.map((cat, index) => {
        const catSubjects = subjectsByCategory[cat.id] ?? []
        if (catSubjects.length === 0) return null
        const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
        const slug = cat.slug as string
        const icon = (cat.icon ?? 'folder') as string

        return (
          <AnimatedSection key={cat.id} delay={0.05 * index}>
            <section>
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

              {/* Auto-scrolling subject cards */}
              <AutoScrollRow
                subjects={catSubjects.slice(0, 20).map(s => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  avg_rating: s.avg_rating,
                  review_count: s.review_count,
                  image_url: s.image_url,
                }))}
                categorySlug={slug}
                categoryIcon={icon}
                locale={locale}
                speed={25}
              />
            </section>
          </AnimatedSection>
        )
      })}

      {/* 7. CTA Banner */}
      <AnimatedSection delay={0.1}>
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
      </AnimatedSection>
    </div>
  )
}
