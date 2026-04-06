'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import BattleCard from '@/components/battle/BattleCard'

type BattleStatus = 'active' | 'ended'

interface ReviewInfo {
  id: string
  title: string
  content: string
  overall_rating: number
  user_nickname: string
}

interface Battle {
  id: string
  review_a_id: string
  review_b_id: string
  votes_a: number
  votes_b: number
  status: BattleStatus
  ends_at: string
  created_at: string
  subject_id: string
  review_a: ReviewInfo
  review_b: ReviewInfo
}

function BattleSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-56 rounded-2xl" />
      ))}
    </div>
  )
}

export default function BattlesPage() {
  const t = useTranslations('battle')
  const { user } = useAuth()
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [activeTab, setActiveTab] = useState<BattleStatus>('active')
  const [battles, setBattles] = useState<Battle[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, 'a' | 'b'>>({})
  const [loading, setLoading] = useState(true)

  const fetchBattles = useCallback(async (status: BattleStatus) => {
    setLoading(true)
    const supabase = createClient()

    const { data: battleRows, error: battleRowsError } = await supabase
      .from('battles')
      .select('id, votes_a, votes_b, status, ends_at, created_at, review_a_id, review_b_id, subject_id')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(20)
    if (battleRowsError) console.error('[BattlesPage] battles query error:', battleRowsError.message)

    if (!battleRows || battleRows.length === 0) {
      setBattles([])
      setLoading(false)
      return
    }

    // Collect all review IDs
    const reviewIds = Array.from(
      new Set([
        ...battleRows.map((b) => b.review_a_id),
        ...battleRows.map((b) => b.review_b_id),
      ])
    )

    // Fetch all reviews at once with user nickname
    const { data: reviewRows, error: reviewRowsError } = await supabase
      .from('reviews')
      .select('id, title, content, overall_rating, user_id, public_profiles(nickname)')
      .in('id', reviewIds)
    if (reviewRowsError) console.error('[BattlesPage] reviews query error:', reviewRowsError.message)

    type ReviewRow = {
      id: string
      title: string
      content: string
      overall_rating: number
      user_id: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      public_profiles: { id: string; nickname: string; avatar_url: string | null; level: string } | { id: string; nickname: string; avatar_url: string | null; level: string }[] | null
    }

    const reviewMap: Record<string, ReviewInfo> = {}
    for (const r of (reviewRows ?? []) as ReviewRow[]) {
      const profileRaw = r.public_profiles
      const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
      reviewMap[r.id] = {
        id: r.id,
        title: r.title,
        content: r.content,
        overall_rating: r.overall_rating,
        user_nickname: profile?.nickname ?? 'Unknown',
      }
    }

    const mapped: Battle[] = battleRows.map((b) => ({
      id: b.id,
      review_a_id: b.review_a_id,
      review_b_id: b.review_b_id,
      votes_a: b.votes_a,
      votes_b: b.votes_b,
      status: b.status as BattleStatus,
      ends_at: b.ends_at,
      created_at: b.created_at,
      subject_id: b.subject_id,
      review_a: reviewMap[b.review_a_id] ?? {
        id: b.review_a_id,
        title: '',
        content: '',
        overall_rating: 0,
        user_nickname: 'Unknown',
      },
      review_b: reviewMap[b.review_b_id] ?? {
        id: b.review_b_id,
        title: '',
        content: '',
        overall_rating: 0,
        user_nickname: 'Unknown',
      },
    }))

    setBattles(mapped)
    setLoading(false)
  }, [])

  const fetchUserVotes = useCallback(
    async (battleIds: string[]) => {
      if (!user || battleIds.length === 0) return
      const supabase = createClient()
      const { data } = await supabase
        .from('battle_votes')
        .select('battle_id, voted_for')
        .eq('user_id', user.id)
        .in('battle_id', battleIds)

      const voteMap: Record<string, 'a' | 'b'> = {}
      for (const row of data ?? []) {
        voteMap[row.battle_id] = row.voted_for as 'a' | 'b'
      }
      setUserVotes(voteMap)
    },
    [user]
  )

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching effects */
  useEffect(() => {
    void fetchBattles(activeTab)
  }, [activeTab, fetchBattles])

  useEffect(() => {
    if (battles.length > 0) {
      void fetchUserVotes(battles.map((b) => b.id))
    }
  }, [battles, fetchUserVotes])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleVote(battleId: string, side: 'a' | 'b') {
    if (!user) return

    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [battleId]: side }))
    setBattles((prev) =>
      prev.map((b) =>
        b.id === battleId
          ? { ...b, votes_a: side === 'a' ? b.votes_a + 1 : b.votes_a, votes_b: side === 'b' ? b.votes_b + 1 : b.votes_b }
          : b
      )
    )

    const supabase = createClient()
    const { error } = await supabase.from('battle_votes').insert({
      battle_id: battleId,
      user_id: user.id,
      voted_for: side,
    })

    if (error) {
      // Rollback optimistic update
      setUserVotes((prev) => {
        const next = { ...prev }
        delete next[battleId]
        return next
      })
      setBattles((prev) =>
        prev.map((b) =>
          b.id === battleId
            ? { ...b, votes_a: side === 'a' ? b.votes_a - 1 : b.votes_a, votes_b: side === 'b' ? b.votes_b - 1 : b.votes_b }
            : b
        )
      )
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-foreground mb-5">{t('battles')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        {(['active', 'ended'] as BattleStatus[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {tab === 'active'
              ? locale === 'ko'
                ? '진행 중'
                : 'Active'
              : locale === 'ko'
              ? '종료됨'
              : 'Ended'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <BattleSkeleton />
      ) : battles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">{t('noBattles')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {battles.map((battle) => (
            <BattleCard
              key={battle.id}
              battle={battle}
              currentUserId={user?.id ?? null}
              userVote={userVotes[battle.id] ?? null}
              locale={locale}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  )
}
