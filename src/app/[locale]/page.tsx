import { createClient } from '@/lib/supabase/server'
import { proxyImageUrl } from '@/lib/utils/image-proxy'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import TrendingSection from '@/components/home/TrendingSection'
import PopularReviewsSection from '@/components/home/PopularReviewsSection'
import ActivityTicker from '@/components/home/ActivityTicker'

const DailyFocusVote = dynamic(() => import('@/components/home/DailyFocusVote'))
const RatingPrediction = dynamic(() => import('@/components/home/RatingPrediction'))

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
  const oneDayAgo = new Date(Date.now() - ONE_DAY_MS).toISOString()
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString()

  const [
    { data: categories },
    { data: allSubjects },
    { data: trendingReviews },
    { count: totalReviewCount },
    { count: totalUserCount },
    { data: tickerReviews },
    { data: dailyTrendingReviews },
    { data: dailyPopularReviews },
    { data: dailyVoteData },
    { data: dailyVoteCountsData },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('subjects').select('id, name, avg_rating, review_count, description, category_id, image_url, categories(slug, name, icon)').limit(200),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count, categories(slug, name, icon))').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id, title, overall_rating, created_at, public_profiles(nickname)').order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count)').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, created_at, subject_id, subjects(name), public_profiles(nickname)').gte('created_at', oneDayAgo).order('helpful_count', { ascending: false }).limit(5),
    supabase.from('daily_votes').select('*').eq('is_active', true).gte('ends_at', new Date().toISOString()).order('starts_at', { ascending: false }).limit(1),
    supabase.from('daily_vote_counts').select('*'),
  ])

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

  return (
    <div className="pb-16">
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

      {/* SECTION 1 — HERO: "Rate Everything." */}
      <section className="px-4 pt-8">
        <h1 className="font-display text-5xl lg:text-6xl text-foreground tracking-tight leading-none mb-3">
          Rate Everything.
        </h1>
        <p className="text-base text-muted-foreground mb-6">
          {locale === 'ko' ? '세상 모든 것을 평가하세요' : 'Rate everything in the world'}
        </p>
        {/* Category quick-access pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {displayCats.map(cat => {
            const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
            const slug = cat.slug as string
            const icon = (cat.icon ?? 'folder') as string
            const color = getCategoryColor(slug)
            return (
              <Link
                key={cat.id}
                href={`/${locale}/category/${slug}`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 ${color} text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity`}
              >
                <CategoryIcon name={icon} className="w-4 h-4" />
                {catName}
              </Link>
            )
          })}
        </div>
      </section>

      {/* SECTION 2 — TODAY'S SUBJECT (Cover Story style) */}
      <section className="px-4">
        <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
          {locale === 'ko' ? '오늘의 주제' : "Today's Subject"} ✨
        </h2>
        {featured[0] && (
          <div className="bg-card border border-border rounded-xl p-6 border-l-4 border-l-primary">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              TODAY&apos;S SUBJECT
            </p>
            <h3 className="font-display text-2xl text-foreground mb-2">
              {(featured[0].name as Record<string, string>)[locale] ?? (featured[0].name as Record<string, string>)['ko']}
            </h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="font-mono text-5xl font-bold text-primary">
                {featured[0].avg_rating?.toFixed(1) ?? '—'}
              </span>
              <span className="font-mono text-lg text-muted-foreground">/ 10</span>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-lg ${i < Math.round((featured[0].avg_rating ?? 0) / 2) ? 'text-primary' : 'text-muted-foreground/20'}`}>★</span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {featured[0].review_count.toLocaleString()}{locale === 'ko' ? '명 평가' : ' ratings'}
            </p>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(featured[0].category_slug)} text-white`}>
                <CategoryIcon name={featured[0].category_icon} className="w-3 h-3" />
                {(featured[0].category_name as Record<string, string>)[locale] ?? (featured[0].category_name as Record<string, string>)['ko']}
              </span>
              <Link href={`/${locale}/subject/${featured[0].id}`} className="text-sm font-medium text-primary hover:underline">
                {locale === 'ko' ? '평가하기 →' : 'Rate now →'}
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3 — DAILY FOCUS VOTE */}
      <section className="px-4 mt-12">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Daily Vote
        </p>
        <DailyFocusVote locale={locale} initialVote={activeVote} initialCounts={voteCounts} />
      </section>

      {/* SECTION 4 — LIVE REVIEW FEED */}
      <section className="px-4 mt-12">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Live Feed
        </p>
        <h2 className="font-display text-2xl text-foreground mb-6">
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
            />
            <div className="mt-6">
              <RatingPrediction locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FEATURED CAROUSEL (Editor's Picks) */}
      <section className="px-4 mt-12">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          {locale === 'ko' ? "Editor's Picks" : "Editor's Picks"}
        </p>
        <h2 className="font-display text-2xl text-foreground mb-6">
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

      {/* SECTION 6 — CATEGORIES */}
      <section className="px-4 mt-12">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Categories
        </p>
        <h2 className="font-display text-2xl text-foreground mb-6">
          {locale === 'ko' ? '카테고리' : 'Browse by Category'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {displayCats.map(cat => {
            const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
            const slug = cat.slug as string
            const icon = (cat.icon ?? 'folder') as string
            const color = getCategoryColor(slug)
            const catSubjects = subjectsByCategory[cat.id] ?? []

            return (
              <Link
                key={cat.id}
                href={`/${locale}/category/${slug}`}
                className="flex items-center gap-4 p-5 border border-border bg-card rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
                  <CategoryIcon name={icon} className="w-5 h-5 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{catName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {catSubjects.length}{locale === 'ko' ? '개' : ' subjects'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* SECTION 7 — CTA */}
      <section className="px-4 mt-12">
        <div className="bg-primary rounded-xl p-8 md:p-12 text-center">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-white/60 mb-3">
            Join Us
          </p>
          <h2 className="font-display text-2xl text-white mb-3">
            {locale === 'ko' ? '당신의 의견을 들려주세요' : 'Share Your Opinion'}
          </h2>
          <p className="text-base max-w-[65ch] text-white/70 mb-6 mx-auto">
            {locale === 'ko' ? '첫 번째 리뷰어가 되어 다른 사람들에게 도움을 주세요.' : 'Be the first reviewer and help others make better choices.'}
          </p>
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3 text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            {locale === 'ko' ? '탐색하기' : 'Explore Now'} →
          </Link>
        </div>
      </section>
    </div>
  )
}
