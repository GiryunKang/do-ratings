'use client'

import { Flame } from 'lucide-react'
import { usePlayerProgress } from '@/lib/game/usePlayerProgress'

export default function RatingStreak({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const { status, progress } = usePlayerProgress()
  if (status !== 'ready' || !progress || progress.streak === 0) return null
  return <div className="rounded-xl border border-border bg-card px-4 py-3">
    <div className="flex items-center gap-2"><Flame className="size-5 shrink-0 text-primary" aria-hidden="true" /><p className="text-sm font-bold">{ko ? `${progress.streak}일 연속 평가` : `${progress.streak}-day review streak`}</p></div>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{progress.todayCount > 0 ? (ko ? '오늘의 발자국을 남겼어요.' : 'Your footprint for today is saved.') : (ko ? '오늘 경험한 대상에 평가를 남기면 이어져요.' : 'Review something you experienced today to keep going.')}</p>
    <p className="mt-1 text-xs text-muted-foreground">{ko ? '한국시간 기준' : 'Based on Korea time'}</p>
  </div>
}
