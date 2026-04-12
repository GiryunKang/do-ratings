'use client'

import { useEffect, useState } from 'react'
import StarRating from '@/components/review/StarRating'

type ReviewInfo = { id: string; title: string; content: string; overall_rating: number; user_nickname: string }

interface BattleCardProps {
  battle: {
    id: string
    review_a: ReviewInfo
    review_b: ReviewInfo
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

interface ReviewSideProps {
  review: ReviewInfo
  side: 'a' | 'b'
  pct: number
  isWinner: boolean
  isMyVote: boolean
  isEnded: boolean
  canVote: boolean
  winnerSide: 'a' | 'b' | 'tie' | null
  labels: { winner: string; voted: string; voteA: string; voteB: string }
  onVote: () => void
}

function ReviewSide({
  review,
  side,
  pct,
  isWinner,
  isMyVote,
  isEnded,
  canVote,
  winnerSide,
  labels,
  onVote,
}: ReviewSideProps) {
  return (
    <div
      className={`flex-1 flex flex-col gap-2 p-3 rounded-xl border transition-colors ${
        isMyVote
          ? 'border-primary bg-primary/10'
          : isWinner && isEnded
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30'
          : 'border-border bg-card'
      }`}
    >
      {isEnded && isWinner && winnerSide !== 'tie' && (
        <span className="self-start text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">
          {labels.winner}
        </span>
      )}
      {isMyVote && !isEnded && (
        <span className="self-start text-xs font-semibold px-2 py-0.5 rounded-full bg-foreground text-background">
          {labels.voted}
        </span>
      )}

      <h3 className="font-semibold text-sm text-foreground line-clamp-1">{review.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{review.content}</p>
      <div className="flex items-center gap-1.5">
        <StarRating value={review.overall_rating} readonly size="sm" />
        <span className="text-xs text-muted-foreground font-medium">{review.overall_rating.toFixed(1)}</span>
      </div>
      <p className="text-xs text-muted-foreground">@{review.user_nickname}</p>

      <p className="text-sm font-bold text-foreground/80 mt-auto">{pct}%</p>

      <button
        type="button"
        disabled={!canVote}
        onClick={() => canVote && onVote()}
        className={`w-full py-1.5 rounded-lg text-sm font-semibold transition-all ${
          isMyVote
            ? 'bg-foreground text-background cursor-default'
            : isEnded
            ? 'bg-muted text-muted-foreground cursor-default'
            : 'bg-foreground text-background hover:opacity-90 hover:shadow-md'
        }`}
      >
        {isMyVote ? labels.voted : side === 'a' ? labels.voteA : labels.voteB}
      </button>
    </div>
  )
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

  let winnerSide: 'a' | 'b' | 'tie' | null = null
  if (isEnded) {
    if (battle.votes_a > battle.votes_b) winnerSide = 'a'
    else if (battle.votes_b > battle.votes_a) winnerSide = 'b'
    else winnerSide = 'tie'
  }

  const labels = {
    vsLabel: 'VS',
    voteA: locale === 'ko' ? 'A에 투표' : 'Vote A',
    voteB: locale === 'ko' ? 'B에 투표' : 'Vote B',
    voted: locale === 'ko' ? '투표 완료' : 'Voted',
    endsIn: locale === 'ko' ? '마감까지' : 'Ends in',
    ended: locale === 'ko' ? '종료됨' : 'Ended',
    winner: locale === 'ko' ? '승자' : 'Winner',
    tie: locale === 'ko' ? '무승부' : 'Tie',
  }

  const canVote = !isEnded && !!currentUserId && !userVote

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isEnded ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {labels.ended}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              {labels.endsIn} {countdown}
            </span>
          )}
          {isEnded && winnerSide === 'tie' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted-foreground/30 text-foreground/80">
              {labels.tie}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{totalVotes} votes</span>
      </div>

      {/* Two sides + VS */}
      <div className="flex items-stretch gap-3">
        <ReviewSide
          review={battle.review_a}
          side="a"
          pct={pctA}
          isWinner={winnerSide === 'a'}
          isMyVote={userVote === 'a'}
          isEnded={isEnded}
          canVote={canVote}
          winnerSide={winnerSide}
          labels={labels}
          onVote={() => onVote(battle.id, 'a')}
        />

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <span className="text-sm font-black text-muted-foreground select-none">{labels.vsLabel}</span>
        </div>

        <ReviewSide
          review={battle.review_b}
          side="b"
          pct={pctB}
          isWinner={winnerSide === 'b'}
          isMyVote={userVote === 'b'}
          isEnded={isEnded}
          canVote={canVote}
          winnerSide={winnerSide}
          labels={labels}
          onVote={() => onVote(battle.id, 'b')}
        />
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex rounded-full overflow-hidden h-2 bg-muted">
        <div
          className={`h-full transition-all duration-500 ${
            userVote === 'a' ? 'bg-primary' : 'bg-gray-400'
          }`}
          style={{ width: `${pctA}%` }}
        />
        <div
          className={`h-full transition-all duration-500 ${
            userVote === 'b' ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  )
}
