'use client'

import { useState, useEffect } from 'react'
import { Vote, Clock, CheckCircle2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface VoteOption {
  id: string
  label: Record<string, string>
  subject_id?: string
}

interface DailyVote {
  id: string
  question: Record<string, string>
  options: VoteOption[]
  ends_at: string
  total_votes: number
}

interface VoteCount {
  option_id: string
  count: number
}

interface DailyFocusVoteProps {
  locale: string
  initialVote?: DailyVote | null
  initialCounts?: VoteCount[]
}

export default function DailyFocusVote({ locale, initialVote, initialCounts }: DailyFocusVoteProps) {
  const { user } = useAuth()
  const [vote] = useState(initialVote)
  const [counts, setCounts] = useState<VoteCount[]>(initialCounts ?? [])
  const [userVote, setUserVote] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!user || !vote) return
    async function checkVote() {
      const supabase = createClient()
      const { data } = await supabase
        .from('daily_vote_responses')
        .select('option_id')
        .eq('vote_id', vote!.id)
        .eq('user_id', user!.id)
        .single()
      if (data) setUserVote(data.option_id)
    }
    checkVote()
  }, [user, vote])

  useEffect(() => {
    if (!vote) return
    function update() {
      const diff = new Date(vote!.ends_at).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft(locale === 'ko' ? '종료' : 'Ended')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(locale === 'ko' ? `${h}시간 ${m}분 남음` : `${h}h ${m}m left`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [vote, locale])

  async function handleVote(optionId: string) {
    if (!user || !vote || userVote || submitting) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('cast_daily_vote', {
        p_vote_id: vote.id,
        p_option_id: optionId,
      })
      if (!error) {
        setUserVote(optionId)
        setCounts(prev => {
          const updated = [...prev]
          const idx = updated.findIndex(c => c.option_id === optionId)
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], count: updated[idx].count + 1 }
          } else {
            updated.push({ option_id: optionId, count: 1 })
          }
          return updated
        })
      }
    } catch {
      // ignore
    }
    setSubmitting(false)
  }

  if (!vote) return null

  const question = vote.question[locale] ?? vote.question['ko'] ?? ''
  const totalVotes = counts.reduce((sum, c) => sum + c.count, 0) || 1
  const hasVoted = !!userVote

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <Vote className="w-5 h-5 text-primary" />
        {locale === 'ko' ? '오늘의 집중투표' : "Today's Focus Vote"}
      </h2>

      <div className="bg-card border border-border overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-display text-xl font-bold text-foreground mb-2">{question}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}
            </span>
            <span>
              {totalVotes.toLocaleString()} {locale === 'ko' ? '표' : 'votes'}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {vote.options.map((option) => {
            const label = option.label[locale] ?? option.label['ko'] ?? ''
            const count = counts.find(c => c.option_id === option.id)?.count ?? 0
            const pct = Math.round((count / totalVotes) * 100)
            const isSelected = userVote === option.id

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || submitting || !user}
                className={`relative w-full text-left p-3 border transition-all overflow-hidden ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : hasVoted
                      ? 'border-border bg-background'
                      : 'border-border hover:border-foreground/30 bg-background'
                }`}
              >
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    <span className={`text-sm font-medium ${isSelected ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                      {label}
                    </span>
                  </div>
                  {hasVoted && (
                    <span className="text-sm font-bold text-muted-foreground tabular-nums">{pct}%</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {!user && (
          <div className="px-6 pb-4">
            <p className="text-xs text-muted-foreground">
              {locale === 'ko' ? '투표하려면 로그인이 필요합니다' : 'Log in to vote'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
