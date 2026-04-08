'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import ShareableFingerprint from '@/components/user/ShareableFingerprint'

interface ReviewFingerprintProps {
  locale: string
}

interface RatingProfile {
  avgRating: number
  totalReviews: number
  ratingDistribution: number[]
  categorySpread: number
  generosity: number
}

export default function ReviewFingerprint({ locale }: ReviewFingerprintProps) {
  const { user } = useAuth()
  const nickname = user?.user_metadata?.nickname || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Reviewer'
  const [profile, setProfile] = useState<RatingProfile | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchProfile() {
      const supabase = createClient()

      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('overall_rating, subject_id, subjects(category_id)')
        .eq('user_id', user!.id)
        .limit(100)
      if (reviewsError) console.error('[ReviewFingerprint] reviews query error:', reviewsError.message)

      if (!reviews || reviews.length === 0) return

      const ratings = reviews.map(r => Number(r.overall_rating))
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length

      const distribution = [0, 0, 0, 0, 0]
      for (const r of ratings) {
        const bucket = Math.min(Math.floor(r) - 1, 4)
        if (bucket >= 0) distribution[bucket]++
      }
      const maxDist = Math.max(...distribution, 1)
      const normalizedDist = distribution.map(d => d / maxDist)

      const uniqueCategories = new Set(
        reviews.map(r => {
          const cat = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
          return (cat as { category_id: string } | null)?.category_id
        }).filter(Boolean)
      )

      setProfile({
        avgRating,
        totalReviews: reviews.length,
        ratingDistribution: normalizedDist,
        categorySpread: uniqueCategories.size,
        generosity: avgRating / 5,
      })
    }

    fetchProfile()
  }, [user])

  const artPaths = useMemo(() => {
    if (!profile) return []

    const paths: { d: string; color: string; delay: number }[] = []
    const cx = 80
    const cy = 80
    const baseRadius = 30

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
      const nextAngle = ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2
      const r = baseRadius * (0.4 + profile.ratingDistribution[i] * 0.6)
      const nextR = baseRadius * (0.4 + profile.ratingDistribution[(i + 1) % 5] * 0.6)

      const x1 = cx + r * Math.cos(angle)
      const y1 = cy + r * Math.sin(angle)
      const x2 = cx + nextR * Math.cos(nextAngle)
      const y2 = cy + nextR * Math.sin(nextAngle)

      const cpx = cx + (r + nextR) * 0.3 * Math.cos((angle + nextAngle) / 2)
      const cpy = cy + (r + nextR) * 0.3 * Math.sin((angle + nextAngle) / 2)

      const colors = ['#FF6B35', '#4ECDC4', '#3B82F6', '#8B5CF6', '#F43F5E']
      paths.push({
        d: `M${cx},${cy} L${x1},${y1} Q${cpx},${cpy} ${x2},${y2} Z`,
        color: colors[i],
        delay: i * 0.1,
      })
    }

    return paths
  }, [profile])

  if (!user || !profile) return null

  const personalityLabel = profile.generosity > 0.7
    ? (locale === 'ko' ? '관대한 리뷰어' : 'Generous Reviewer')
    : profile.generosity > 0.5
    ? (locale === 'ko' ? '균형 잡힌 리뷰어' : 'Balanced Reviewer')
    : (locale === 'ko' ? '엄격한 리뷰어' : 'Strict Reviewer')

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-display text-base font-bold tracking-tight text-foreground mb-3">
        {locale === 'ko' ? '나의 평가 성향' : 'My Rating Profile'}
      </h3>

      <div className="flex items-center gap-4">
        {/* Abstract art */}
        <svg viewBox="0 0 160 160" className="w-24 h-24 shrink-0">
          {artPaths.map((path, i) => (
            <motion.path
              key={i}
              d={path.d}
              fill={path.color}
              fillOpacity={0.25}
              stroke={path.color}
              strokeWidth={1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: path.delay }}
            />
          ))}
          {/* Center dot */}
          <circle cx={80} cy={80} r={3} fill="white" stroke="#FF6B35" strokeWidth={1} />
        </svg>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-black tracking-tight text-foreground">{personalityLabel}</p>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{locale === 'ko' ? '평균 점수' : 'Avg Score'}</span>
              <span className="font-mono font-bold text-primary">★ {profile.avgRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{locale === 'ko' ? '리뷰 수' : 'Reviews'}</span>
              <span className="font-bold text-foreground">{profile.totalReviews}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{locale === 'ko' ? '카테고리' : 'Categories'}</span>
              <span className="font-bold text-foreground">{profile.categorySpread}</span>
            </div>
          </div>
          <ShareableFingerprint
            locale={locale}
            nickname={nickname}
            avgRating={profile.avgRating}
            totalReviews={profile.totalReviews}
            categorySpread={profile.categorySpread}
            personalityLabel={personalityLabel}
          />
        </div>
      </div>
    </div>
  )
}
