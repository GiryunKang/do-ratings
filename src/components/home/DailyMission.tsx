'use client'

import Link from 'next/link'
import { Check, Target } from 'lucide-react'
import { usePlayerProgress } from '@/lib/game/usePlayerProgress'

export default function DailyMission({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const { status, progress, retry } = usePlayerProgress()
  return <section className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-2"><Target className="size-5 text-primary" aria-hidden="true" /><h2 className="text-sm font-bold">{ko ? '오늘의 미션' : "Today's challenge"}</h2></div>
    {status === 'loading' && <p role="status" className="mt-3 text-sm text-muted-foreground">{ko ? '기록 확인 중…' : 'Checking your reviews…'}</p>}
    {status === 'error' && <div className="mt-3"><p role="alert" className="text-sm text-muted-foreground">{ko ? '미션 진척을 불러오지 못했어요.' : 'Could not load your challenge.'}</p><button type="button" onClick={retry} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">{ko ? '다시 시도' : 'Try again'}</button></div>}
    {status === 'guest' && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ko ? '로그인 후 저장한 평가로 미션을 채워보세요.' : 'Sign in and save reviews to complete your challenges.'}</p>}
    {progress && <div className="mt-3"><p className="text-sm font-semibold">{ko ? `${progress.dailyMission.ko} 1개 평가하기` : `Review one in ${progress.dailyMission.en}`}</p><p className="mt-1 text-xs text-muted-foreground">{ko ? '한국시간 자정 기준' : 'Resets at midnight KST'}</p>{progress.dailyCompleted && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary"><Check className="size-4" aria-hidden="true" />{ko ? '오늘의 미션 완료' : 'Challenge complete'}</p>}</div>}
    <Link href={progress && !progress.dailyCompleted ? `/${locale}/explore?category=${progress.dailyMission.slug}` : `/${locale}/play`} className="mt-3 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">{ko ? '탐험 이어가기' : 'Keep exploring'}</Link>
  </section>
}
