import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'

const ReviewTheater = dynamic(() => import('@/components/home/ReviewTheater'))
const WeeklyCrown = dynamic(() => import('@/components/home/WeeklyCrown'))
const ReviewWorldMap = dynamic(() => import('@/components/home/ReviewWorldMap'))

interface TheaterReview {
  id: string
  title: string
  content: string
  overall_rating: number
  subject_name: string
  nickname: string
}

export default async function HighlightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: theaterReviews, error: e0 },
    { data: crownReviews, error: e1 },
    { data: worldMapReviews, error: e2 },
  ] = await Promise.all([
    supabase.from('reviews').select('id, title, content, overall_rating, subjects(name), public_profiles(nickname)').gt('helpful_count', 0).order('helpful_count', { ascending: false }).limit(10),
    supabase.from('reviews').select('id, title, content, overall_rating, helpful_count, subject_id, subjects(name), public_profiles(nickname)').gte('created_at', sevenDaysAgo).order('helpful_count', { ascending: false }).limit(1),
    supabase.from('reviews').select('id, title, overall_rating, created_at, country_code, subjects(name), public_profiles(nickname)').not('country_code', 'is', null).order('created_at', { ascending: false }).limit(100),
  ])

  const queryErrors = [e0, e1, e2].filter(Boolean)
  if (queryErrors.length > 0) {
    console.error('[HighlightsPage] Supabase query errors:', queryErrors.map(e => e!.message))
  }

  const mappedTheaterReviews: TheaterReview[] = (theaterReviews ?? []).map(r => {
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      overall_rating: r.overall_rating,
      subject_name: (subject?.name as Record<string, string>)?.[locale] ?? (subject?.name as Record<string, string>)?.['ko'] ?? '',
      nickname: (profile?.nickname as string) ?? 'Anonymous',
    }
  })

  const crownRaw = crownReviews?.[0] ?? null
  let mappedCrown = null
  if (crownRaw) {
    const subject = Array.isArray(crownRaw.subjects) ? crownRaw.subjects[0] : crownRaw.subjects
    const profile = Array.isArray(crownRaw.public_profiles) ? crownRaw.public_profiles[0] : crownRaw.public_profiles
    mappedCrown = {
      id: crownRaw.id,
      title: crownRaw.title,
      content: crownRaw.content,
      overall_rating: crownRaw.overall_rating,
      helpful_count: crownRaw.helpful_count,
      subject_id: crownRaw.subject_id,
      subject_name: (subject?.name as Record<string, string>)?.[locale] ?? (subject?.name as Record<string, string>)?.['ko'] ?? '',
      nickname: (profile?.nickname as string) ?? 'Anonymous',
    }
  }

  const mappedWorldReviews = (worldMapReviews ?? []).map(r => {
    const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
    const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
    return {
      id: r.id,
      title: r.title,
      overall_rating: r.overall_rating,
      created_at: r.created_at,
      country_code: r.country_code,
      subject_name: (subject?.name as Record<string, string>)?.[locale] ?? (subject?.name as Record<string, string>)?.['ko'] ?? '',
      nickname: (profile?.nickname as string) ?? 'Anonymous',
    }
  })

  return (
    <div className="pb-16">
      {/* Page header */}
      <section className="px-4 pt-8">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Highlights
        </p>
        <h1 className="font-display text-3xl text-foreground mb-2">
          {locale === 'ko' ? '하이라이트' : 'Highlights'}
        </h1>
        <p className="text-base text-muted-foreground max-w-[65ch]">
          {locale === 'ko'
            ? '최고의 리뷰, 이번 주의 왕관, 그리고 전 세계 리뷰 지도.'
            : 'Top reviews, weekly crown, and a global review map.'}
        </p>
      </section>

      {/* Weekly Crown */}
      <section className="px-4 mt-16">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Weekly Crown
        </p>
        <h2 className="font-display text-2xl text-foreground mb-6">
          {locale === 'ko' ? '이번 주의 왕관' : "This Week's Crown"}
        </h2>
        <WeeklyCrown locale={locale} initialCrown={mappedCrown} />
      </section>

      {/* Review Theater */}
      <section className="px-4 mt-16">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Review Theater
        </p>
        <h2 className="font-display text-2xl text-foreground mb-6">
          {locale === 'ko' ? '리뷰 극장' : 'Review Theater'}
        </h2>
        <ReviewTheater locale={locale} initialReviews={mappedTheaterReviews} />
      </section>

      {/* World Map */}
      <section className="px-4 mt-16">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Global Reviews
        </p>
        <h2 className="font-display text-2xl text-foreground mb-6">
          {locale === 'ko' ? '세계 리뷰 지도' : 'Review World Map'}
        </h2>
        <ReviewWorldMap locale={locale} initialReviews={mappedWorldReviews} />
      </section>
    </div>
  )
}
