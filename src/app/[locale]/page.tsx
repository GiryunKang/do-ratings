import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Search } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { proxyImageUrl } from '@/lib/utils/image-proxy'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { displayRating, ratingPercent } from '@/lib/utils/rating'

import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import TrendingSection from '@/components/home/TrendingSection'
import PopularReviewsSection from '@/components/home/PopularReviewsSection'
import ActivityTicker from '@/components/home/ActivityTicker'

const DailyFocusVote = dynamic(() => import('@/components/home/DailyFocusVote'))
const DailyMission = dynamic(() => import('@/components/home/DailyMission'))
const RatingPrediction = dynamic(() => import('@/components/home/RatingPrediction'))
const ReviewStarterDeck = dynamic(() => import('@/components/home/ReviewStarterDeck'))
const QuickRateStars = dynamic(() => import('@/components/home/QuickRateStars'))

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

  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS
  // Server component: Date.now() executes once during SSR, not during client render
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - ONE_DAY_MS).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString()

  const [
    { data: categories, error: e0 },
    { data: allSubjects, error: eSubjects },
    { data: trendingReviews, error: e1 },
    { count: totalReviewCount, error: e2 },
    { count: totalUserCount, error: e3 },
    { data: tickerReviews, error: e4 },
    { data: dailyTrendingReviews, error: e5 },
    { data: dailyPopularReviews, error: e6 },
    { data: dailyVoteData, error: e7 },
    { data: dailyVoteCountsData, error: e8 },
    { data: popularReviewsData, error: e9 },
    { data: topReviewersData, error: e10 },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('subjects').select('id, name, avg_rating, review_count, description, category_id, image_url, categories(slug, name, icon)').limit(200),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count, categories(slug, name, icon))').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id, title, overall_rating, created_at, public_profiles!reviews_user_id_fkey(nickname)').order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count)').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, created_at, subject_id, subjects(name), public_profiles!reviews_user_id_fkey(nickname)').gte('created_at', oneDayAgo).order('helpful_count', { ascending: false }).limit(5),
    supabase.from('daily_votes').select('*').eq('is_active', true).gte('ends_at', new Date().toISOString()).order('starts_at', { ascending: false }).limit(1),
    supabase.from('daily_vote_counts').select('*'),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, subject_id, subjects(name, categories(slug, name)), public_profiles!reviews_user_id_fkey(nickname)').gt('helpful_count', 0).order('helpful_count', { ascending: false }).limit(3),
    supabase.from('public_profiles').select('id, nickname, review_count').order('review_count', { ascending: false }).limit(3),
  ])

  const queryErrors = [e0, eSubjects, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10].filter(Boolean)
  if (queryErrors.length > 0) {
    console.error('[HomePage] Supabase query errors:', queryErrors.map(e => e!.message))
  }

  const cats = ((categories ?? []) as CategoryRecord[]).sort((a, b) => {
    const ai = categoryOrder.indexOf(a.slug as string)
    const bi = categoryOrder.indexOf(b.slug as string)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  const subjects = (allSubjects ?? []) as SubjectRecord[]

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

  const weeklyReviewCounts = new Map<string, number>()
  for (const r of (trendingReviews ?? [])) {
    const sid = (r as { subject_id: string }).subject_id
    weeklyReviewCounts.set(sid, (weeklyReviewCounts.get(sid) ?? 0) + 1)
  }

  let featured: typeof mappedSubjects
  if (weeklyReviewCounts.size >= 3) {
    featured = [...mappedSubjects]
      .sort((a, b) => (
        (weeklyReviewCounts.get(b.id) ?? 0) - (weeklyReviewCounts.get(a.id) ?? 0) ||
        b.review_count - a.review_count ||
        (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
      ))
      .slice(0, 8)
  } else {
    const byCategory = new Map<string, typeof mappedSubjects>()
    for (const s of mappedSubjects) {
      const list = byCategory.get(s.category_slug) ?? []
      list.push(s)
      byCategory.set(s.category_slug, list)
    }
    const balanced: typeof mappedSubjects = []
    for (const slug of categoryOrder) {
      const list = byCategory.get(slug) ?? []
      list.sort((a, b) => b.review_count - a.review_count || (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
      balanced.push(...list.slice(0, 2))
    }
    featured = balanced.slice(0, 8)
  }

  const subjectsByCategory: Record<string, typeof mappedSubjects> = {}
  for (const s of mappedSubjects) {
    if (!subjectsByCategory[s.category_id]) subjectsByCategory[s.category_id] = []
    subjectsByCategory[s.category_id].push(s)
  }

  const tickerData = (tickerReviews ?? []).map(r => {
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    return {
      id: r.id,
      title: r.title,
      overall_rating: r.overall_rating,
      created_at: r.created_at,
      nickname: (profile?.nickname as string) ?? 'Someone',
    }
  })

  const dailyTrendingMap = new Map<string, TrendingSubject>()
  for (const r of (dailyTrendingReviews ?? [])) {
    type DailyTrendingSubject = { id: string; name: LocalizedText; image_url: string | null; avg_rating: number | null; review_count: number }
    const s = Array.isArray(r.subjects) ? (r.subjects as DailyTrendingSubject[])[0] : r.subjects as DailyTrendingSubject | null
    if (!s) continue
    const existing = dailyTrendingMap.get(s.id)
    if (existing) {
      existing.recentCount++
    } else {
      dailyTrendingMap.set(s.id, {
        id: s.id,
        name: s.name as LocalizedText,
        image_url: s.image_url,
        avg_rating: s.avg_rating,
        review_count: s.review_count,
        recentCount: 1,
      })
    }
  }
  const initialTrendingItems = [...dailyTrendingMap.values()]
    .sort((a, b) => b.recentCount - a.recentCount)
    .slice(0, 6)

  const initialPopularReviews = (dailyPopularReviews ?? []).map(r => {
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      overall_rating: r.overall_rating,
      helpful_count: r.helpful_count,
      subject_id: r.subject_id,
      subject_name: ((subject?.name ?? {}) as Record<string, string>),
      nickname: ((profile?.nickname as string) ?? 'Anonymous'),
      created_at: r.created_at,
    }
  })

  const activeVote = (dailyVoteData?.[0] ?? null) as {
    id: string
    question: Record<string, string>
    options: { id: string; label: Record<string, string>; subject_id?: string }[]
    ends_at: string
    total_votes: number
  } | null
  const voteCounts = ((dailyVoteCountsData ?? []) as { vote_id: string; option_id: string; count: number }[])
    .filter(c => c.vote_id === activeVote?.id)
    .map(c => ({ option_id: c.option_id, count: c.count }))

  const displayCats = cats.slice(0, 6)
  const isPeopleCover = featured[0]?.category_slug === 'people'

  // Process top reviewers for leaderboard
  const topReviewers = (topReviewersData ?? []).map(r => ({
    id: r.id as string,
    nickname: (r.nickname as string) ?? 'Anonymous',
    reviewCount: (r.review_count as number) ?? 0,
  }))

  // Process popular reviews for 인기 평가글 section
  type PopularReviewSubject = { name: Record<string, string>; categories: { slug: string; name: Record<string, string> } | { slug: string; name: Record<string, string> }[] | null }
  type PopularReviewProfile = { nickname: string }
  const popularReviewCards = (popularReviewsData ?? []).map(r => {
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects as PopularReviewSubject | null
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles as PopularReviewProfile | null
    const cat = subject?.categories ? (Array.isArray(subject.categories) ? subject.categories[0] : subject.categories) : null
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      overall_rating: r.overall_rating,
      helpful_count: r.helpful_count,
      subject_id: r.subject_id,
      subjectName: (subject?.name ?? {} as Record<string, string>)[locale] ?? '',
      categoryName: (cat?.name ?? {} as Record<string, string>)[locale] ?? '',
      nickname: profile?.nickname ?? 'Anonymous',
    }
  }).filter(r => r.helpful_count > 0)

  return (
    <div className={`pb-16 ${isPeopleCover ? 'bg-[#F7F7F7]' : ''}`}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Do! Ratings!',
            url: 'https://do-ratings.com',
            description: locale === 'ko' ? '세상 모든 것을 평가하는 글로벌 리뷰 플랫폼' : 'A global review platform to rate everything',
            potentialAction: { '@type': 'SearchAction', target: `https://do-ratings.com/${locale}/explore?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
          }),
        }}
      />

      {/* SECTION 1: "무엇이든 평가하세요" Search Module */}
      <section className="px-6 pt-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-display text-2xl font-black tracking-tight text-foreground mb-4">
            {locale === 'ko' ? '무엇이든 평가하세요' : 'Rate Anything'}
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={locale === 'ko' ? '항공사, 호텔, 맛집, 인물...' : 'Airlines, hotels, restaurants, people...'}
              className="w-full pl-12 pr-4 py-3.5 border border-border bg-background rounded-full text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {displayCats.map(cat => {
              const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
              const slug = cat.slug as string
              const icon = (cat.icon ?? 'folder') as string
              const color = getCategoryColor(slug)
              return (
                <Link
                  key={cat.id}
                  href={`/${locale}/category/${slug}`}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 ${color} text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity`}
                >
                  <CategoryIcon name={icon} className="w-3.5 h-3.5" />
                  {catName}
                </Link>
              )
            })}
            <Link
              href={`/${locale}/explore`}
              className="inline-flex items-center gap-1 px-3.5 py-2 border border-dashed border-primary text-primary text-xs font-medium rounded-full hover:bg-primary/5 transition-colors"
            >
              + {locale === 'ko' ? '주제 추가' : 'Add Topic'}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {locale === 'ko' ? '새로운 평가 주제를 직접 추가할 수 있어요' : 'You can add new topics to rate'}
          </p>
        </div>
      </section>

      {/* SECTION 2: Cover Story + Live Index (Editorial Split) */}
      <section className="px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Cover Story (7 cols) */}
          <div className="lg:col-span-7 relative overflow-hidden">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">Cover Story</p>
            {featured[0] && (
              <div className="relative">
                {/* Ghost category stamp */}
                <span className="absolute top-0 right-0 font-display text-[80px] leading-none text-foreground/[0.04] uppercase select-none pointer-events-none">
                  {(featured[0].category_name as Record<string, string>)['en']?.toUpperCase() ?? ''}
                </span>
                <h3 className="font-display text-3xl lg:text-4xl font-black tracking-tight text-foreground mb-2">
                  {(featured[0].name as Record<string, string>)[locale] ?? (featured[0].name as Record<string, string>)['ko']}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 italic">
                  &ldquo;{locale === 'ko' ? `${(featured[0].category_name as Record<string, string>)[locale] ?? ''} 분야의 주목받는 평가, 지금 확인하세요` : 'A trending evaluation in this category'}&rdquo;
                </p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`font-mono text-7xl font-bold tracking-tighter ${isPeopleCover ? 'text-[#111111]' : 'text-primary'}`}>
                    {displayRating(featured[0].avg_rating)}
                  </span>
                  <span className="font-mono text-xl text-muted-foreground">/ 10</span>
                </div>
                {!isPeopleCover && (
                  <div className="mb-3">
                    <QuickRateStars subjectId={featured[0].id} locale={locale} size="md" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(featured[0].category_slug)} text-white`}>
                    <CategoryIcon name={featured[0].category_icon} className="w-3 h-3" />
                    {(featured[0].category_name as Record<string, string>)[locale] ?? ''}
                  </span>
                  <Link href={`/${locale}/subject/${featured[0].id}`} className={`text-sm font-medium hover:underline ${isPeopleCover ? 'text-[#333333]' : 'text-primary'}`}>
                    {locale === 'ko' ? '평가하기 →' : 'Rate now →'}
                  </Link>
                </div>
              </div>
            )}
          </div>
          {/* RIGHT: Live Index (5 cols) */}
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">Live Index</p>
            <div className="space-y-0 divide-y divide-border">
              {featured.slice(1, 5).map((s) => (
                <Link key={s.id} href={`/${locale}/subject/${s.id}`} className="flex items-center justify-between py-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-foreground">{(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(s.category_slug)} text-white mt-1`}>
                      {(s.category_name as Record<string, string>)[locale] ?? ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-xl font-semibold ${s.category_slug === 'people' ? 'text-[#111111]' : 'text-primary'}`}>{displayRating(s.avg_rating)}</span>
                    <p className="text-[10px] text-muted-foreground">{s.review_count} {locale === 'ko' ? '평가' : 'ratings'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Taste Ticker Ribbon */}
      <section className={`mt-8 py-3 overflow-hidden ${isPeopleCover ? 'bg-[#F0F0F0]' : 'bg-primary'}`}>
        <div className="animate-ticker whitespace-nowrap flex">
          {[...featured, ...featured].map((s, i) => (
            <span key={i} className={`inline-flex items-center gap-2 mx-6 text-sm font-medium ${isPeopleCover ? 'text-[#333333]' : 'text-white'}`}>
              {(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}
              <span className="font-mono font-bold">{displayRating(s.avg_rating)}</span>
              <span className={isPeopleCover ? 'text-[#999999]' : 'text-white/40'}>●</span>
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 4: Top 5 + Categories (Asymmetric 65/35) */}
      <section className="px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Top 5 (8 cols) */}
          <div className="lg:col-span-8">
            <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-4 flex items-center gap-2">
              {locale === 'ko' ? '이번 주 TOP 5' : 'Weekly TOP 5'} 🔥
            </h2>
            <div className="space-y-3">
              {featured.slice(0, 5).map((s, idx) => {
                const barWidth = ratingPercent(s.avg_rating)
                const barColors = ['bg-primary', 'bg-secondary', 'bg-blue-500', 'bg-violet-500', 'bg-rose-500']
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className={`font-display text-lg w-6 text-center ${idx < 3 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{idx + 1}</span>
                    <span className="text-sm font-medium text-foreground w-28 truncate">
                      {(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${barColors[idx]} rounded-full transition-all`} style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className="font-mono text-sm font-semibold text-foreground w-8 text-right">{displayRating(s.avg_rating)}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {/* RIGHT: Categories (4 cols) */}
          <div className="lg:col-span-4">
            <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-4">
              {locale === 'ko' ? '카테고리 탐색' : 'Categories'}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {displayCats.map(cat => {
                const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
                const slug = cat.slug as string
                const icon = (cat.icon ?? 'folder') as string
                const catSubjects = subjectsByCategory[cat.id] ?? []
                const totalReviews = catSubjects.reduce((sum, s) => sum + s.review_count, 0)
                const bgColors: Record<string, string> = {
                  people: 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50',
                  places: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
                  companies: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50',
                  restaurants: 'bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/50',
                  airlines: 'bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50',
                  hotels: 'bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/50',
                }
                const bgColor = bgColors[slug] ?? 'bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50'
                const color = getCategoryColor(slug)
                return (
                  <Link
                    key={cat.id}
                    href={`/${locale}/category/${slug}`}
                    className={`flex items-center gap-3 p-3 rounded-xl ${bgColor} transition-colors`}
                  >
                    <span className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                      <CategoryIcon name={icon} className="w-5 h-5 text-white" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground">{catName}</p>
                      <p className="text-[11px] text-muted-foreground">{catSubjects.length}{locale === 'ko' ? '개 주제 · ' : ' subjects · '}{totalReviews.toLocaleString()}{locale === 'ko' ? ' 리뷰' : ' reviews'}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4.5: ReviewStarterDeck — first-time user onboarding */}
      <section className="px-6 mt-8">
        <ReviewStarterDeck locale={locale} />
      </section>

      {/* SECTION 5: "당신이 아직 평가하지 않은 주제" (Personalized) */}
      <section className="px-6 mt-8">
        <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-2">
          {locale === 'ko' ? '당신이 아직 평가하지 않은 주제' : "Topics You Haven't Rated"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {locale === 'ko' ? '로그인하면 맞춤 추천을 받을 수 있어요' : 'Log in for personalized recommendations'}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {featured.slice(3, 7).map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${getCategoryColor(s.category_slug)} text-white mb-2`}>
                {(s.category_name as Record<string, string>)[locale] ?? ''}
              </span>
              <p className="font-medium text-sm text-foreground mb-1 truncate">
                {(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}
              </p>
              <p className="font-mono text-lg font-semibold text-primary mb-2">{displayRating(s.avg_rating)}</p>
              <div className="mb-2">
                <QuickRateStars subjectId={s.id} locale={locale} />
              </div>
              <Link
                href={`/${locale}/subject/${s.id}`}
                className="inline-flex items-center justify-center w-full px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                {locale === 'ko' ? '평가하기' : 'Rate'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: 인기 평가글 (Popular Reviews Feed) */}
      <section className="px-6 mt-8">
        <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-2 flex items-center gap-2">
          {locale === 'ko' ? '인기 평가글' : 'Popular Reviews'} 🔥
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {locale === 'ko' ? '지금 가장 많은 공감을 받고 있는 평가' : 'Most liked reviews right now'}
        </p>
        <div className="space-y-4">
          {popularReviewCards.map(review => (
            <div
              key={review.id}
              className="bg-card border border-border rounded-xl p-5 border-l-4 hover:shadow-sm transition-shadow"
              style={{ borderLeftColor: 'var(--primary)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{review.categoryName}</span>
                <span className="text-sm font-medium text-foreground">{review.subjectName}</span>
                <span className="ml-auto font-mono text-lg font-semibold text-primary">{review.overall_rating}점</span>
              </div>
              <p className="font-medium text-sm text-foreground mb-1">{review.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{review.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">👍 {review.helpful_count}</span>
                  <span>{review.nickname}</span>
                </div>
                <Link href={`/${locale}/subject/${review.subject_id}`} className="text-primary hover:underline">
                  {locale === 'ko' ? '나도 평가하기' : 'Rate this too'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6.5: 기간별 랭킹 */}
      <section className="px-6 mt-8">
        <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-4">
          {locale === 'ko' ? '랭킹' : 'Rankings'}
        </h2>
        <div className="flex gap-0 mb-4 border-b border-border">
          {['일간', '주간', '월간', '분기', '연간'].map((period, i) => (
            <span
              key={period}
              className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${i === 1 ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {period}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {locale === 'ko' ? '평점 TOP' : 'Rating TOP'}
            </p>
            <div className="space-y-2">
              {featured.slice(0, 5).map((s, idx) => {
                const barWidth = ratingPercent(s.avg_rating)
                const barColors = ['bg-gradient-to-r from-primary to-orange-400', 'bg-gradient-to-r from-secondary to-teal-400', 'bg-gradient-to-r from-blue-500 to-blue-400', 'bg-gradient-to-r from-violet-500 to-violet-400', 'bg-gradient-to-r from-rose-500 to-rose-400']
                return (
                  <Link key={s.id} href={`/${locale}/subject/${s.id}`} className="flex items-center gap-3 group">
                    <span className={`font-display text-base w-5 text-center ${idx < 3 ? 'text-primary font-black' : 'text-muted-foreground font-medium'}`}>{idx + 1}</span>
                    <span className="text-sm font-medium text-foreground w-24 truncate group-hover:text-primary transition-colors">
                      {(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}
                    </span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${barColors[idx]} rounded-full`} style={{ width: `${barWidth}%` }} />
                    </div>
                    <span className="font-mono text-sm font-bold text-primary w-8 text-right">{displayRating(s.avg_rating)}</span>
                    {idx === 0 && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-semibold">NEW</span>}
                    {idx === 1 && <span className="text-[10px] text-secondary font-mono">▲ 1</span>}
                    {idx === 2 && <span className="text-[10px] text-destructive font-mono">▼ 1</span>}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {locale === 'ko' ? '리뷰 수 TOP' : 'Most Reviewed'}
            </p>
            <div className="space-y-2">
              {[...mappedSubjects].sort((a, b) => b.review_count - a.review_count).slice(0, 5).map((s, idx) => (
                <Link key={s.id} href={`/${locale}/subject/${s.id}`} className="flex items-center justify-between py-2 hover:bg-muted/50 transition-colors rounded px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground w-4">{idx + 1}</span>
                    <span className="text-sm text-foreground">{(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}</span>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">{s.review_count}{locale === 'ko' ? '건' : ''}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6.7: 화제의 평가 */}
      <section className="px-6 mt-8">
        <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-2">
          {locale === 'ko' ? '화제의 평가' : 'Trending Evaluations'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {locale === 'ko' ? '점수 변동이 크거나 갑자기 관심이 몰리는 주제' : 'Subjects with significant score changes or sudden interest'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.slice(0, 3).map((s) => {
            const recentCount = weeklyReviewCounts.get(s.id) ?? 0
            const isRising = recentCount > 2
            const badge = isRising
              ? { label: locale === 'ko' ? '급상승' : 'Rising', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' }
              : { label: locale === 'ko' ? '주목' : 'Notable', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400' }
            return (
              <Link key={s.id} href={`/${locale}/subject/${s.id}`} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${badge.bg} ${badge.text} mb-3`}>
                  {badge.label}
                </span>
                <p className="font-display font-bold text-base text-foreground mb-1">
                  {(s.name as Record<string, string>)[locale] ?? (s.name as Record<string, string>)['ko']}
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-mono text-2xl font-bold text-foreground">{s.avg_rating?.toFixed(1) ?? '—'}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {locale === 'ko' ? '이번 주' : 'This week'} {recentCount}{locale === 'ko' ? '건 평가' : ' reviews'}
                </p>
                <span className="mt-3 inline-flex w-full justify-center text-xs font-medium text-muted-foreground border border-border rounded-full py-1.5 hover:border-primary hover:text-primary transition-colors">
                  {locale === 'ko' ? '평가 참여하기' : 'Join evaluation'}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* SECTION 7: Live Feed (Trending + Popular + Activity Ticker + RatingPrediction) */}
      <section className="px-6 mt-8">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Live Feed
        </p>
        <h2 className="font-display text-2xl font-black tracking-tight text-foreground mb-6">
          {locale === 'ko' ? '실시간 리뷰' : 'Real-Time Reviews'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <TrendingSection locale={locale} initialItems={initialTrendingItems} />
            <PopularReviewsSection locale={locale} initialReviews={initialPopularReviews} />
          </div>
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                {locale === 'ko' ? '실시간' : 'Live'}
              </p>
            </div>
            <ActivityTicker
              locale={locale}
              recentReviews={tickerData}
              totalReviews={totalReviewCount ?? 0}
              totalSubjects={subjects.length}
              totalUsers={totalUserCount ?? 0}
              variant={isPeopleCover ? 'muted' : 'default'}
            />
            <div className="mt-6">
              <RatingPrediction locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Featured Carousel */}
      <section className="px-6 mt-12">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {locale === 'ko' ? "Editor's Picks" : "Editor's Picks"}
        </p>
        <h2 className="font-display text-2xl font-black tracking-tight text-foreground mb-6">
          {locale === 'ko' ? '주목할 대상' : 'Featured'}
        </h2>
        <FeaturedCarousel subjects={featured.map(s => ({
          id: s.id,
          name: s.name,
          avg_rating: s.avg_rating,
          review_count: s.review_count,
          category_slug: s.category_slug,
          category_name: s.category_name,
          category_icon: s.category_icon,
          image_url: proxyImageUrl(s.image_url),
        }))} locale={locale} />
      </section>

      {/* SECTION 9: Community Pulse (3 columns) */}
      {!isPeopleCover && <section className="px-6 mt-8 bg-muted/50 -mx-0 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground mb-4">{locale === 'ko' ? '이번 주 리뷰왕' : 'Top Reviewers'} 👑</h3>
            <div className="space-y-3">
              {topReviewers.length > 0 ? topReviewers.map((reviewer, i) => {
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <Link key={reviewer.id} href={`/${locale}/profile/${reviewer.id}`} className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors">
                    <span>{medals[i] ?? `${i + 1}`}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {reviewer.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{reviewer.nickname}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-foreground shrink-0">{reviewer.reviewCount}{locale === 'ko' ? '리뷰' : ''}</span>
                  </Link>
                )
              }) : (
                <p className="text-sm text-muted-foreground">{locale === 'ko' ? '아직 리뷰어가 없습니다' : 'No reviewers yet'}</p>
              )}
            </div>
          </div>
          {/* Daily Vote + Mission */}
          <div>
            <div className="mb-4">
              <DailyMission locale={locale} />
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground mb-4">{locale === 'ko' ? '오늘의 투표' : 'Daily Poll'}</h3>
            <DailyFocusVote locale={locale} initialVote={activeVote} initialCounts={voteCounts} />
          </div>
          {/* Live Activity */}
          <div>
            <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
              {locale === 'ko' ? '최근 활동' : 'Recent Activity'}
            </h3>
            <div className="space-y-3">
              {tickerData.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {r.nickname.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{r.nickname}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.title} · ★{r.overall_rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}

      {/* SECTION 10: Challenge CTA Banner */}
      {!isPeopleCover && <section className="px-6 mt-8">
        <div className="bg-primary rounded-xl p-6 md:p-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-white/60 mb-1">
              {locale === 'ko' ? '오늘의 챌린지' : "Today's Challenge"}
            </p>
            <p className="font-display text-lg md:text-xl text-white">
              {locale === 'ko' ? '가장 좋아하는 카페를 평가하세요!' : 'Rate your favorite cafe!'}
            </p>
          </div>
          <Link
            href={`/${locale}/explore`}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
          >
            <span className="text-primary text-xl">→</span>
          </Link>
        </div>
      </section>}

      {/* SECTION 11: CTA — "평가하고 싶은 주제가 없으신가요?" */}
      <section className="px-6 mt-8 pb-8">
        <div className="border border-border rounded-xl p-8 text-center">
          <p className="text-foreground font-medium mb-2">
            {locale === 'ko' ? '평가하고 싶은 주제가 없으신가요?' : "Can't find what you want to rate?"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {locale === 'ko' ? '직접 추가하고 첫 번째 평가자가 되어보세요' : 'Add it yourself and be the first to rate'}
          </p>
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-10 py-4 text-base rounded-full hover:opacity-90 transition-opacity"
          >
            {locale === 'ko' ? '주제 추가하기' : 'Add Topic'}
          </Link>
          <p className="mt-3">
            <Link href={`/${locale}/explore`} className="text-sm text-primary hover:underline">
              {locale === 'ko' ? '또는 탐색하기 →' : 'or explore →'}
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
