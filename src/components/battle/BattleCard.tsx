'use client'

import { useEffect, useState } from 'react'
import StarRating from '@/components/review/StarRating'

interface BattleCardProps {
  battle: {
    id: string
    review_a: { id: string; title: string; content: string; overall_rating: number; user_nickname: string }
    review_b: { id: string; title: string; content: string; overall_rating: number; user_nickname: string }
    votes_a: number
    votes_b: number
    status: 'active' | 'ended'
    ends_at: string
  }
  currentUserId: string | null
  userVote: 'a' | 'b' | null
  locale: string
  onVote: (battleId: string, side: 'a' | 'b') => void
}

function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function calc() {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('0h 0m')
        return
      }
      const totalMinutes = Math.floor(diff / 60000)
      const days = Math.floor(totalMinutes / 1440)
      const hours = Math.floor((totalMinutes % 1440) / 60)
      const minutes = totalMinutes % 60
      if (days > 0) setTimeLeft(`${days}d ${hours}h`)
      else setTimeLeft(`${hours}h ${minutes}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [endsAt])

  return timeLeft
}

export default function BattleCard({
  battle,
  currentUserId,
  userVote,
  locale,
  onVote,
}: BattleCardProps) {
  const totalVotes = battle.votes_a + battle.votes_b
  const pctA = totalVotes === 0 ? 50 : Math.round((battle.votes_a / totalVotes) * 100)
  const pctB = 100 - pctA
  const countdown = useCountdown(battle.ends_at)
  const isEnded = battle.status === 'ended'

  // Determine winner
  let winnerSide: 'a' | 'b' | 'tie' | null = null
  if (isEnded) {
    if (battle.votes_a > battle.votes_b) winnerSide = 'a'
    else if (battle.votes_b > battle.votes_a) winnerSide = 'b'
    else winnerSide = 'tie'
  }

  const t = {
    vsLabel: locale === 'ko' ? 'VS' : 'VS',
    voteA: locale === 'ko' ? 'A에 투표' : 'Vote A',
    voteB: locale === 'ko' ? 'B에 투표' : 'Vote B',
    voted: locale === 'ko' ? '투표 완료' : 'Voted',
    endsIn: locale === 'ko' ? '마감까지' : 'Ends in',
    ended: locale === 'ko' ? '종료됨' : 'Ended',
    winner: locale === 'ko' ? '승자' : 'Winner',
    tie: locale === 'ko' ? '무승부' : 'Tie',
  }

  function ReviewSide({
    review,
    side,
    pct,
    isWinner,
  }: {
    review: BattleCardProps['battle']['review_a']
    side: 'a' | 'b'
    pct: number
    isWinner: boolean
  }) {
    const isMyVote = userVote === side
    const canVote = !isEnded && currentUserId && !userVote

    return (
      <div
        className={`flex-1 flex flex-col gap-2 p-3 rounded-xl border transition-colors ${
          isMyVote
            ? 'border-indigo-400 bg-indigo-50'
            : isWinner && isEnded
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-200 bg-white'
        }`}
      >
        {/* Winner / voted badge */}
        {isEnded && isWinner && winnerSide !== 'tie' && (
          <span className="self-start text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">
            {t.winner}
          </span>
        )}
        {isMyVote && !isEnded && (
          <span className="self-start text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
            {t.voted}
          </span>
        )}

        {/* Review info */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{review.title}</h3>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{review.content}</p>
        <div className="flex items-center gap-1.5">
          <StarRating value={review.overall_rating} readonly size="sm" />
          <span className="text-xs text-gray-500 font-medium">{review.overall_rating.toFixed(1)}</span>
        </div>
        <p className="text-xs text-gray-400">@{review.user_nickname}</p>

        {/* Vote percentage */}
        <p className="text-sm font-bold text-gray-700 mt-auto">{pct}%</p>

        {/* Vote button */}
        <button
          type="button"
          disabled={!canVote}
          onClick={() => canVote && onVote(battle.id, side)}
          className={`w-full py-1.5 rounded-lg text-sm font-semibold transition-all ${
            isMyVote
              ? 'bg-indigo-500 text-white cursor-default'
              : isEnded || userVote
              ? 'bg-gray-100 text-gray-400 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
          }`}
        >
          {isMyVote ? t.voted : side === 'a' ? t.voteA : t.voteB}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isEnded ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
              {t.ended}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              {t.endsIn} {countdown}
            </span>
          )}
          {isEnded && winnerSide === 'tie' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-300 text-gray-700">
              {t.tie}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{totalVotes} votes</span>
      </div>

      {/* Two sides + VS */}
      <div className="flex items-stretch gap-3">
        <ReviewSide
          review={battle.review_a}
          side="a"
          pct={pctA}
          isWinner={winnerSide === 'a'}
        />

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <span className="text-sm font-black text-gray-400 select-none">{t.vsLabel}</span>
        </div>

        <ReviewSide
          review={battle.review_b}
          side="b"
          pct={pctB}
          isWinner={winnerSide === 'b'}
        />
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex rounded-full overflow-hidden h-2 bg-gray-100">
        <div
          className={`h-full transition-all duration-500 ${
            userVote === 'a' ? 'bg-indigo-500' : 'bg-gray-400'
          }`}
          style={{ width: `${pctA}%` }}
        />
        <div
          className={`h-full transition-all duration-500 ${
            userVote === 'b' ? 'bg-indigo-500' : 'bg-gray-300'
          }`}
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  )
}
