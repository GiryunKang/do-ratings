import { createClient } from '@/lib/supabase/server'
import { proxyImageUrl } from '@/lib/utils/image-proxy'
import dynamic from 'next/dynamic'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import HeroBanner from '@/components/home/HeroBanner'
import AutoScrollRow from '@/components/home/AutoScrollRow'
import TrendingSection from '@/components/home/TrendingSection'
import PopularReviewsSection from '@/components/home/PopularReviewsSection'
import ActivityTicker from '@/components/home/ActivityTicker'
import RatingStreak from '@/components/home/RatingStreak'
import AnimatedSection from '@/components/ui/AnimatedSection'
import GlowCard from '@/components/ui/GlowCard'
import CountUp from '@/components/ui/CountUp'
import SpotlightCard from '@/components/home/SpotlightCard'
import Link from 'next/link'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'
import {
  MessageCircle,
  Layers,
  PenLine,
  Sparkles,
  Clapperboard,
  Crown,
  Globe,
} from 'lucide-react'

const DailyFocusVote = dynamic(() => import('@/components/home/DailyFocusVote'))
const StarConstellation = dynamic(() => import('@/components/home/StarConstellation'))
const SubjectShuffle = dynamic(() => import('@/components/home/SubjectShuffle'))
const ReviewStarterDeck = dynamic(() => import('@/components/home/ReviewStarterDeck'))
const GhostReviews = dynamic(() => import('@/components/home/GhostReviews'))
const RatingRoulette = dynamic(() => import('@/components/home/RatingRoulette'))
const QuickFaceoff = dynamic(() => import('@/components/home/QuickFaceoff'))
const ReviewFingerprint = dynamic(() => import('@/components/home/ReviewFingerprint'))
const MysterySubject = dynamic(() => import('@/components/home/MysterySubject'))
const RatingPrediction = dynamic(() => import('@/components/home/RatingPrediction'))
const ReviewWorldMap = dynamic(() => import('@/components/home/ReviewWorldMap'))
const ReviewTheater = dynamic(() => import('@/components/home/ReviewTheater'))
const WeeklyCrown = dynamic(() => import('@/components/home/WeeklyCrown'))

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
    { data: recentReviews },
    { data: trendingReviews },
    { data: popularReviews },
    { count: totalReviewCount },
    { count: totalUserCount },
    { data: tickerReviews },
    { data: dailyTrendingReviews },
    { data: dailyPopularReviews },
    { data: worldMapReviews },
    { data: theaterReviews },
    { data: crownReviews },
    { data: dailyVoteData },
    { data: dailyVoteCountsData },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('subjects').select('id, name, avg_rating, review_count, description, category_id, image_url, categories(slug, name, icon)').limit(200),
    supabase.from('reviews').select('id, title, overall_rating, created_at, subjects(name, categories(name))').order('created_at', { ascending: false }).limit(5),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count, categories(slug, name, icon))').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, created_at, user_id, subject_id, subjects(name, categories(name, slug)), public_profiles(nickname, level, avatar_url)').order('helpful_count', { ascending: false }).limit(5),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id, title, overall_rating, created_at, public_profiles(nickname)').order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('subject_id, subjects(id, name, image_url, avg_rating, review_count)').gte('created_at', oneDayAgo).order('created_at', { ascending: false }).limit(50),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, created_at, subject_id, subjects(name), public_profiles(nickname)').gte('created_at', oneDayAgo).order('helpful_count', { ascending: false }).limit(5),
    supabase.from('reviews').select('id, title, overall_rating, created_at, country_code, subjects(name), public_profiles(nickname)').not('country_code', 'is', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('reviews').select('id, title, content, overall_rating, subjects(name), public_profiles(nickname)').gt('helpful_count', 0).order('helpful_count', { ascending: false }).limit(10),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, subject_id, subjects(name), public_profiles(nickname)').gte('created_at', sevenDaysAgo).order('helpful_count', { ascending: false }).limit(1),
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

  const spotlights = [...mappedSubjects]
    .sort((a, b) => (
      (b.avg_rating ?? 0) - (a.avg_rating ?? 0) ||
      b.review_count - a.review_count ||
      a.id.localeCompare(b.id)
    ))
    .slice(0, 3)

  const subjectsByCategory: Record<string, typeof mappedSubjects> = {}
  for (const s of mappedSubjects) {
    if (!subjectsByCategory[s.category_id]) subjectsByCategory[s.category_id] = []
    subjectsByCategory[s.category_id].push(s)
  }

  const totalSubjects = subjects.length
  const totalCategories = cats.length
  const totalReviews = (recentReviews ?? []).length

  type TrendingSubjectRow = { id: string; name: LocalizedText; image_url: string | null; avg_rating: number | null; review_count: number }
  const trendingMap = new Map<string, TrendingSubject>()
  for (const r of (trendingReviews ?? [])) {
    const s = pickRelation(r.subjects as TrendingSubjectRow | TrendingSubjectRow[] | null)
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

  type PopularSubjectRow = { name: LocalizedText; categories: { name: LocalizedText; slug: string } | { name: LocalizedText; slug: string }[] | null }
  type ProfileRow = { nickname: string; level: string; avatar_url: string | null }
  const topReviews = (popularReviews ?? []).map(r => {
    const subject = pickRelation(r.subjects as PopularSubjectRow | PopularSubjectRow[] | null)
    const profile = pickRelation(r.public_profiles as ProfileRow | ProfileRow[] | null)
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

  // Process ActivityTicker data server-side
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

  // Process daily trending for TrendingSection initial data
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

  // Process daily popular for PopularReviewsSection initial data
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

  // Process ReviewWorldMap data server-side
  const worldMapData = (worldMapReviews ?? []).map(r => {
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    const nameObj = (subject?.name ?? {}) as Record<string, string>
    return {
      id: r.id,
      title: r.title,
      overall_rating: r.overall_rating,
      subject_name: nameObj[locale] ?? nameObj['ko'] ?? '',
      nickname: (profile?.nickname as string) ?? 'Anonymous',
      country_code: r.country_code ?? '',
      created_at: r.created_at,
    }
  })

  // Process ReviewTheater data server-side
  const theaterData = (theaterReviews ?? []).map(r => {
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    const nameObj = (subject?.name ?? {}) as Record<string, string>
    return {
      id: r.id,
      title: r.title,
      content: (r.content as string).slice(0, 200),
      overall_rating: r.overall_rating,
      subject_name: nameObj[locale] ?? nameObj['ko'] ?? '',
      nickname: (profile?.nickname as string) ?? 'Anonymous',
    }
  })

  // Process WeeklyCrown data server-side
  const crownData = await (async () => {
    if (!crownReviews || crownReviews.length === 0) return null
    const r = crownReviews[0]
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    const nameObj = (subject?.name ?? {}) as Record<string, string>

    let trophySvg: string | null = null
    try {
      const apiKey = process.env.QUIVER_AI_API_KEY
      if (apiKey) {
        const { QuiverAI } = await import('@quiverai/sdk')
        const client = new QuiverAI({ bearerAuth: apiKey })
        const response = await client.createSVGs.generateSVG({
          model: 'arrow-preview',
          prompt: 'A golden trophy award badge for best review of the week. Crown on top, star in center, laurel wreath border. Gold and amber colors.',
          instructions: 'badge style, medal-like, gold and amber palette',
          n: 1,
          temperature: 0.5,
        })
        const result = response.result as { data?: { svg?: string }[] } | undefined
        const svgDoc = result?.data?.[0]
        if (svgDoc?.svg) trophySvg = svgDoc.svg
      }
    } catch {
      // QuiverAI unavailable, component uses fallback SVG
    }

    return {
      id: r.id,
      title: r.title,
      content: (r.content as string).slice(0, 150),
      overall_rating: r.overall_rating,
      helpful_count: r.helpful_count,
      subject_id: r.subject_id,
      subject_name: nameObj[locale] ?? nameObj['ko'] ?? '',
      nickname: (profile?.nickname as string) ?? 'Anonymous',
      trophySvg,
    }
  })()

  // Daily focus vote data
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

  // MysterySubject data — pass mapped subjects instead of re-fetching
  const mysterySubjects = mappedSubjects.map(s => ({
    id: s.id,
    name: s.name as Record<string, string>,
    category_slug: s.category_slug as string,
    category_icon: s.category_icon as string,
    category_name: s.category_name as Record<string, string>,
    avg_rating: s.avg_rating,
    review_count: s.review_count,
  }))

  return (
    <div className="px-4 py-4 space-y-6">
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

      {/* 0. Hero Banner with Star Constellation overlay */}
      <AnimatedSection delay={0}>
        <div className="relative">
          <HeroBanner locale={locale} />
          <StarConstellation
            subjects={mappedSubjects.map(s => ({
              id: s.id,
              name: s.name,
              category_slug: s.category_slug,
              category_icon: s.category_icon,
              category_name: s.category_name,
            }))}
            locale={locale}
          />
        </div>
      </AnimatedSection>

      {/* Activity Ticker — live platform pulse */}
      <ActivityTicker
        locale={locale}
        recentReviews={tickerData}
        totalReviews={totalReviewCount ?? 0}
        totalSubjects={totalSubjects}
        totalUsers={totalUserCount ?? 0}
      />

      {/* Rating Streak — duolingo-style consecutive day tracker */}
      <RatingStreak locale={locale} />

      {/* Daily Focus Vote — engagement driver */}
      <AnimatedSection delay={0.05}>
        <DailyFocusVote locale={locale} initialVote={activeVote} initialCounts={voteCounts} />
      </AnimatedSection>

      {/* Mobile category quick links */}
      <div className="relative md:hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mt-2 px-1">
          {cats.map(cat => {
            const catName = (cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>)['ko']
            const color = getCategoryColor(cat.slug)
            return (
              <Link key={cat.id} href={`/${locale}/category/${cat.slug}`}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-card shadow-sm ring-1 ring-foreground/[0.06] rounded-full text-xs font-semibold hover:shadow-md hover:scale-105 active:scale-95 transition-all`}>
                <span className={`w-5 h-5 rounded-full ${color} flex items-center justify-center`}>
                  <CategoryIcon name={(cat.icon ?? 'folder') as string} className="w-3 h-3 text-white" />
                </span>
                {catName}
              </Link>
            )
          })}
        </div>
        {/* Fade hint — wider for better scroll indication */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

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
          image_url: proxyImageUrl(s.image_url),
        }))} locale={locale} />
      </AnimatedSection>

      {/* 2. Trending + Popular Reviews — side by side */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrendingSection locale={locale} initialItems={initialTrendingItems} />
          <PopularReviewsSection locale={locale} initialReviews={initialPopularReviews} />
        </div>
      </AnimatedSection>

      {/* 2.5 Review Starter Deck + Ghost Reviews — engagement when data is sparse */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReviewStarterDeck locale={locale} />
          <GhostReviews locale={locale} />
        </div>
      </AnimatedSection>

      {/* 3. Quick Stats Banner */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-3 gap-3">
          <GlowCard className="p-4 text-center">
            <CountUp target={totalSubjects} className="text-2xl font-bold text-foreground" />
            <p className="text-xs text-muted-foreground mt-1">{locale === 'ko' ? '등록된 대상' : 'Subjects'}</p>
          </GlowCard>
          <GlowCard className="p-4 text-center">
            <CountUp target={totalCategories} className="text-2xl font-bold text-foreground" />
            <p className="text-xs text-muted-foreground mt-1">{locale === 'ko' ? '카테고리' : 'Categories'}</p>
          </GlowCard>
          <GlowCard className="bg-primary p-4 text-center">
            {totalReviews > 0 ? (
              <>
                <CountUp target={totalReviews} className="text-2xl font-bold text-foreground" />
                <p className="text-xs text-foreground/70 mt-1">{locale === 'ko' ? '리뷰' : 'Reviews'}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-foreground/70 mt-1">{locale === 'ko' ? '첫 리뷰를 기다리는 중' : 'Waiting for you'}</p>
              </>
            )}
          </GlowCard>
        </div>
      </AnimatedSection>

      {/* 5. Spotlight: "어떻게 생각하세요?" */}
      <AnimatedSection delay={0.1}>
        <section>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {locale === 'ko' ? '이 대상에 대해 어떻게 생각하세요?' : 'What do you think about...?'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {spotlights.map(subject => {
              const name = subject.name[locale] ?? subject.name['ko']
              const desc = subject.description?.[locale] ?? subject.description?.['ko'] ?? ''
              const catName = subject.category_name[locale] ?? subject.category_name['ko']
              return (
                <SpotlightCard
                  key={subject.id}
                  href={`/${locale}/subject/${subject.id}`}
                  name={name}
                  desc={desc}
                  catName={catName}
                  categorySlug={subject.category_slug}
                  categoryIcon={subject.category_icon}
                  rateLabel={locale === 'ko' ? '평가하기 →' : 'Rate now →'}
                />
              )
            })}
          </div>
        </section>
      </AnimatedSection>

      {/* 5.5 Subject Shuffle — interactive random discovery */}
      <AnimatedSection delay={0.1}>
        <SubjectShuffle
          subjects={mappedSubjects.map(s => ({
            id: s.id,
            name: s.name,
            avg_rating: s.avg_rating,
            review_count: s.review_count,
            image_url: proxyImageUrl(s.image_url),
            category_slug: s.category_slug,
            category_name: s.category_name,
            category_icon: s.category_icon,
          }))}
          locale={locale}
        />
      </AnimatedSection>

      {/* 5.7 Quick Face-off + Mystery Subject */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickFaceoff
            subjects={mappedSubjects.map(s => ({
              id: s.id,
              name: s.name,
              avg_rating: s.avg_rating,
              image_url: proxyImageUrl(s.image_url),
              category_slug: s.category_slug,
              category_icon: s.category_icon,
              category_name: s.category_name,
            }))}
            locale={locale}
          />
          <MysterySubject locale={locale} subjects={mysterySubjects} />
        </div>
      </AnimatedSection>

      {/* 5.8 Rating Roulette + Prediction + Fingerprint */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RatingRoulette
            subjects={mappedSubjects.map(s => ({
              id: s.id,
              name: s.name,
              image_url: proxyImageUrl(s.image_url),
              category_slug: s.category_slug,
              category_icon: s.category_icon,
              category_name: s.category_name,
            }))}
            locale={locale}
          />
          <RatingPrediction locale={locale} />
          <ReviewFingerprint locale={locale} />
        </div>
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
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full ${getCategoryColor(slug)} flex items-center justify-center`}>
                    <CategoryIcon name={icon} className="w-4 h-4 text-white" />
                  </span>
                  {catName}
                  <span className="text-xs font-normal text-muted-foreground ml-1">({catSubjects.length})</span>
                </h2>
                <Link href={`/${locale}/category/${slug}`} className="text-xs text-primary hover:opacity-70 font-medium flex items-center gap-1 transition-opacity">
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
                  image_url: proxyImageUrl(s.image_url),
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

      {/* 6.5 Review Theater + Weekly Crown */}
      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReviewTheater locale={locale} initialReviews={theaterData} />
          <WeeklyCrown locale={locale} initialCrown={crownData} />
        </div>
      </AnimatedSection>

      {/* 6.7 World Review Map */}
      <AnimatedSection delay={0.1}>
        <ReviewWorldMap locale={locale} initialReviews={worldMapData} />
      </AnimatedSection>

      {/* 7. CTA Banner */}
      <AnimatedSection delay={0.1}>
        <div className="bg-foreground p-8 md:p-10 text-center">
          <h2 className="font-serif text-xl md:text-2xl text-background mb-2">
            {locale === 'ko' ? '당신의 의견을 들려주세요' : 'Share Your Opinion'}
          </h2>
          <p className="text-sm text-background/60 mb-5 max-w-md mx-auto">
            {locale === 'ko' ? '첫 번째 리뷰어가 되어 다른 사람들에게 도움을 주세요!' : 'Be the first reviewer and help others!'}
          </p>
          <Link href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 bg-background text-foreground font-semibold px-6 py-2.5 text-sm hover:opacity-90 transition-opacity">
            {locale === 'ko' ? '탐색하기' : 'Explore Now'} →
          </Link>
        </div>
      </AnimatedSection>
    </div>
  )
}
