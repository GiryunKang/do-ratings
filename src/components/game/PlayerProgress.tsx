'use client'

import Link from 'next/link'
import { ArrowRight, Compass, RefreshCw } from 'lucide-react'
import { usePlayerProgress } from '@/lib/game/usePlayerProgress'

export default function PlayerProgress({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const { status, progress, retry } = usePlayerProgress()
  return (
    <section aria-label={ko ? '나의 취향 탐험' : 'Your taste journey'} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Compass className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold">{ko ? '경험을 모으면, 취향이 보인다' : 'Collect experiences. Find your taste.'}</h2>
        </div>
        <Link href={`/${locale}/play`} className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {ko ? '탐험 노트' : 'Your journey'}<ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {status === 'loading' && <p role="status" className="mt-3 text-sm text-muted-foreground">{ko ? '평가 기록을 확인하고 있어요…' : 'Checking your saved reviews…'}</p>}
      {status === 'error' && <div className="mt-3 flex flex-wrap items-center gap-3"><p role="alert" className="text-sm text-muted-foreground">{ko ? '진척을 불러오지 못했어요.' : 'Could not load your progress.'}</p><button type="button" onClick={retry} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><RefreshCw className="size-4" aria-hidden="true" />{ko ? '다시 시도' : 'Try again'}</button></div>}
      {status === 'guest' && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ko ? '6개 분야를 둘러보고, 로그인 후 남긴 평가로 나만의 도장을 모아보세요.' : 'Explore six categories. Sign in and save reviews to fill your own collection.'}</p>}
      {progress && <div className="mt-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p><strong>{ko ? progress.stage.ko : progress.stage.en}</strong><span className="ml-2 text-muted-foreground">{ko ? `평가 ${progress.total}개 · 도장 ${progress.categoryCount}/6` : `${progress.total} reviews · ${progress.categoryCount}/6 stamps`}</span></p><span className="text-muted-foreground">{progress.nextStage ? (ko ? `다음 단계까지 ${progress.nextStage.minimum - progress.total}개` : `${progress.nextStage.minimum - progress.total} to next stage`) : (ko ? '마지막 단계 도달' : 'Final stage reached')}</span></div>
        <progress className="h-2 w-full overflow-hidden rounded-full accent-primary" value={progress.stagePercent} max={100} aria-label={ko ? '다음 탐험 단계 진척' : 'Progress to next explorer stage'} />
      </div>}
    </section>
  )
}
