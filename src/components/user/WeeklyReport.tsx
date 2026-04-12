'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, Share2, Minus } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { displayRating } from '@/lib/utils/rating'

interface WeeklyReportProps {
  locale: string
}

interface WeekStats {
  reviewCount: number
  categories: string[]
  avgRating: number
  lastWeekCount: number
  rank: number
  totalReviewers: number
}

export default function WeeklyReport({ locale }: WeeklyReportProps) {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<WeekStats | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)

  useEffect(() => {
    if (!user) return

    setFetchLoading(true)
    async function fetchStats() {
      const supabase = createClient()
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

      // This week's reviews
      const { data: thisWeek, error: e1 } = await supabase
        .from('reviews')
        .select('id, overall_rating, subjects(categories(slug, name))')
        .eq('user_id', user!.id)
        .gte('created_at', sevenDaysAgo)
      if (e1) console.error('[WeeklyReport] this week query error:', e1.message)

      // Last week's count
      const { count: lastWeekCount, error: e2 } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .gte('created_at', fourteenDaysAgo)
        .lt('created_at', sevenDaysAgo)
      if (e2) console.error('[WeeklyReport] last week query error:', e2.message)

      // My rank
      const { data: myProfile, error: e3 } = await supabase
        .from('public_profiles')
        .select('review_count')
        .eq('id', user!.id)
        .single()
      if (e3 && e3.code !== 'PGRST116') console.error('[WeeklyReport] profile query error:', e3.message)

      const myCount = (myProfile?.review_count as number) ?? 0
      const { count: higherCount, error: e4 } = await supabase
        .from('public_profiles')
        .select('id', { count: 'exact', head: true })
        .gt('review_count', myCount)
      if (e4) console.error('[WeeklyReport] rank query error:', e4.message)

      const { count: totalCount, error: e5 } = await supabase
        .from('public_profiles')
        .select('id', { count: 'exact', head: true })
        .gt('review_count', 0)
      if (e5) console.error('[WeeklyReport] total query error:', e5.message)

      const reviews = thisWeek ?? []
      const ratings = reviews.map(r => Number(r.overall_rating))
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

      const categorySet = new Set<string>()
      for (const r of reviews) {
        const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
        const cat = subject?.categories
        const catObj = Array.isArray(cat) ? cat[0] : cat
        const catName = (catObj as { name: Record<string, string> } | null)?.name?.[locale] ?? ''
        if (catName) categorySet.add(catName)
      }

      setStats({
        reviewCount: reviews.length,
        categories: [...categorySet],
        avgRating,
        lastWeekCount: lastWeekCount ?? 0,
        rank: (higherCount ?? 0) + 1,
        totalReviewers: totalCount ?? 1,
      })
      setFetchLoading(false)
    }

    fetchStats()
  }, [user, locale])

  // Derive combined loading state: auth not settled yet, or user exists but fetch not done
  const loading = authLoading || (!!user && fetchLoading)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{locale === 'ko' ? '로그인이 필요합니다' : 'Login required'}</p>
        <Link href={`/${locale}/auth/login`} className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          {locale === 'ko' ? '로그인' : 'Login'}
        </Link>
      </div>
    )
  }

  if (!stats) return null

  // Empty state
  if (stats.reviewCount === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">📝</p>
        <p className="font-display text-xl font-bold tracking-tight text-foreground mb-2">
          {locale === 'ko' ? '이번 주 아직 평가하지 않았네요' : 'No reviews this week yet'}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {locale === 'ko' ? '지금 시작해서 주간 리포트를 채워보세요!' : 'Start now to build your weekly report!'}
        </p>
        <Link href={`/${locale}/explore`} className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
          {locale === 'ko' ? '평가 시작하기' : 'Start Rating'} →
        </Link>
      </div>
    )
  }

  const percentile = stats.totalReviewers > 0 ? Math.round((1 - (stats.rank - 1) / stats.totalReviewers) * 100) : 100
  const trend = stats.reviewCount - stats.lastWeekCount
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'

  async function handleShare() {
    const text = locale === 'ko'
      ? `📊 이번 주 DO! Ratings! 리포트\n평가: ${stats!.reviewCount}건 | 카테고리: ${stats!.categories.length}개 | 평균: ${displayRating(stats!.avgRating)}점 | 상위 ${percentile}%\n\nhttps://do-ratings.com`
      : `📊 My DO! Ratings! Weekly Report\nReviews: ${stats!.reviewCount} | Categories: ${stats!.categories.length} | Avg: ${displayRating(stats!.avgRating)} | Top ${percentile}%\n\nhttps://do-ratings.com`

    if (navigator.share) {
      try { await navigator.share({ title: 'DO! Ratings! Weekly Report', text }) } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert(locale === 'ko' ? '클립보드에 복사되었습니다!' : 'Copied to clipboard!')
      } catch { /* unavailable */ }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
          {locale === 'ko' ? '이번 주 나의 평가' : 'My Week in Reviews'}
        </h1>
        <button type="button" onClick={handleShare} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          <Share2 className="w-4 h-4" />
          {locale === 'ko' ? '공유' : 'Share'}
        </button>
      </div>

      {/* Hero stat */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center"
      >
        <p className="font-mono text-6xl font-bold text-primary mb-2">{stats.reviewCount}</p>
        <p className="text-sm text-muted-foreground">
          {locale === 'ko' ? '건의 평가를 작성했어요' : 'reviews written'}
        </p>
        <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          {trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : '0'}
          <span className="text-muted-foreground ml-1">{locale === 'ko' ? '지난 주 대비' : 'vs last week'}</span>
        </div>
      </motion.div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-mono text-2xl font-bold text-foreground">{stats.categories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{locale === 'ko' ? '카테고리' : 'Categories'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-mono text-2xl font-bold text-primary">{displayRating(stats.avgRating)}</p>
          <p className="text-xs text-muted-foreground mt-1">{locale === 'ko' ? '평균 점수' : 'Avg Score'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="font-mono text-2xl font-bold text-foreground">{percentile}%</p>
          <p className="text-xs text-muted-foreground mt-1">{locale === 'ko' ? '상위' : 'Top'}</p>
        </div>
      </div>

      {/* Categories covered */}
      {stats.categories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            {locale === 'ko' ? '평가한 카테고리' : 'Categories Covered'}
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.categories.map(cat => (
              <span key={cat} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rank */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {locale === 'ko' ? `전체 리뷰어 중 ${stats.rank}위` : `Ranked #${stats.rank} overall`}
          </p>
          <p className="text-xs text-muted-foreground">
            {locale === 'ko' ? `${stats.totalReviewers}명 중` : `out of ${stats.totalReviewers}`}
          </p>
        </div>
        <span className="font-mono text-2xl font-bold text-primary">#{stats.rank}</span>
      </div>
    </div>
  )
}
