'use client'

import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface MyRankingProps {
  locale: string
}

export default function MyRanking({ locale }: MyRankingProps) {
  const { user } = useAuth()
  const [rank, setRank] = useState<number | null>(null)
  const [totalReviewers, setTotalReviewers] = useState(0)
  const [myReviewCount, setMyReviewCount] = useState(0)

  useEffect(() => {
    if (!user) return

    async function fetchRanking() {
      const supabase = createClient()

      // Get my profile
      const { data: myProfile, error: profileError } = await supabase
        .from('public_profiles')
        .select('review_count')
        .eq('id', user!.id)
        .single()
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[MyRanking] profile query error:', profileError.message)
      }

      if (!myProfile) return

      const myCount = (myProfile.review_count as number) ?? 0
      setMyReviewCount(myCount)

      // Count how many reviewers have more reviews than me
      const { count: higherCount, error: higherError } = await supabase
        .from('public_profiles')
        .select('id', { count: 'exact', head: true })
        .gt('review_count', myCount)
      if (higherError) console.error('[MyRanking] higher count error:', higherError.message)

      // Count total reviewers
      const { count: total, error: totalError } = await supabase
        .from('public_profiles')
        .select('id', { count: 'exact', head: true })
        .gt('review_count', 0)
      if (totalError) console.error('[MyRanking] total count error:', totalError.message)

      const safeTotal = total ?? 1
      setRank((higherCount ?? 0) + 1)
      setTotalReviewers(safeTotal)
    }

    fetchRanking()
  }, [user])

  if (!user || rank === null || myReviewCount === 0) return null

  const percentile = totalReviewers > 0
    ? Math.round((1 - (rank - 1) / totalReviewers) * 100)
    : 100

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            {locale === 'ko' ? `전체 리뷰어 중 ${rank}위` : `Ranked #${rank} overall`}
          </p>
          <p className="text-sm text-muted-foreground">
            {locale === 'ko'
              ? `상위 ${percentile}% · ${myReviewCount}건의 평가 작성`
              : `Top ${percentile}% · ${myReviewCount} reviews written`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-bold text-primary">#{rank}</p>
          <p className="text-[11px] text-muted-foreground">/ {totalReviewers}</p>
        </div>
      </div>
    </div>
  )
}
