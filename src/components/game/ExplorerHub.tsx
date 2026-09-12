'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, Check, Compass, Flag, Flame, Hotel, MapPin, Plane, RefreshCw, Shuffle, Stamp, UserRound, Utensils, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { displayRating } from '@/lib/utils/rating'
import { EXPLORER_CATEGORIES } from '@/lib/game/progress'
import { usePlayerProgress } from '@/lib/game/usePlayerProgress'

const categoryIcons: Record<string, LucideIcon> = { restaurants: Utensils, places: MapPin, hotels: Hotel, airlines: Plane, companies: Building2, people: UserRound }
const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

interface DiscoverySubject {
  id: string
  name: Record<string, string>
  avg_rating: number | null
  review_count: number
}

function DiscoveryCard({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const [subjects, setSubjects] = useState<DiscoverySubject[]>([])
  const [index, setIndex] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setStatus('loading')
      try {
        const { data, error } = await createClient().from('subjects')
          .select('id, name, avg_rating, review_count')
          .order('created_at', { ascending: false }).limit(60)
        if (cancelled) return
        if (error) throw error
        const rows = (data ?? []) as DiscoverySubject[]
        setSubjects(rows)
        setIndex(rows.length ? Math.floor(Math.random() * rows.length) : 0)
        setStatus('ready')
      } catch { if (!cancelled) setStatus('error') }
    }
    void load()
    return () => { cancelled = true }
  }, [attempt])

  function next() {
    if (subjects.length < 2) return
    setIndex(current => (current + 1 + Math.floor(Math.random() * (subjects.length - 1))) % subjects.length)
  }
  const subject = subjects[index]

  return <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="discovery-heading">
    <div className="flex items-center gap-2"><Shuffle className="size-5 text-primary" aria-hidden="true" /><h2 id="discovery-heading" className="font-display text-xl font-bold">{ko ? '우연히 만나는 다음 취향' : 'Meet your next discovery'}</h2></div>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ko ? '최근 등록된 대상 중 하나를 만나보세요. 직접 경험했다면 내 평가를 남겨보세요.' : 'Meet a recently added subject. If you have experienced it, share your own review.'}</p>
    <div className="my-5 flex min-h-36 flex-col justify-center border-y border-border py-6" aria-live="polite" aria-atomic="true">
      {status === 'loading' ? <p className="text-sm text-muted-foreground">{ko ? '새로운 대상을 찾고 있어요…' : 'Finding something to explore…'}</p>
        : status === 'error' ? <p role="alert" className="text-sm text-muted-foreground">{ko ? '대상을 불러오지 못했어요. 다시 시도해주세요.' : 'Could not load subjects. Please try again.'}</p>
        : !subject ? <p className="text-sm text-muted-foreground">{ko ? '아직 둘러볼 대상이 없어요.' : 'There are no subjects to explore yet.'}</p>
        : <><h3 className="break-words font-display text-2xl font-bold">{subject.name[locale] ?? subject.name.ko ?? subject.name.en ?? (ko ? '평가 대상' : 'Subject')}</h3><p className="mt-3 text-sm text-muted-foreground">{subject.avg_rating == null ? (ko ? '아직 평점 없음' : 'No rating yet') : `${displayRating(subject.avg_rating)} / 10`}<span className="mx-2" aria-hidden="true">·</span>{ko ? `평가 ${subject.review_count}개` : `${subject.review_count} reviews`}</p></>}
    </div>
    <div className="flex flex-wrap gap-2">
      {status === 'error' ? <button type="button" onClick={() => setAttempt(value => value + 1)} className={`${actionClass} bg-primary text-primary-foreground hover:bg-primary/90`}><RefreshCw className="size-4" aria-hidden="true" />{ko ? '다시 시도' : 'Try again'}</button> : <>
        {subject && status === 'ready' && <Link href={`/${locale}/subject/${subject.id}`} className={`${actionClass} bg-primary text-primary-foreground hover:bg-primary/90`}>{ko ? '대상 살펴보기' : 'Explore this'}<ArrowRight className="size-4" aria-hidden="true" /></Link>}
        <button type="button" onClick={next} disabled={status !== 'ready' || subjects.length < 2} className={`${actionClass} border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50`}><Shuffle className="size-4" aria-hidden="true" />{ko ? '다른 대상' : 'Next subject'}</button>
      </>}
    </div>
  </section>
}

export default function ExplorerHub({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const { status, progress, retry } = usePlayerProgress()
  const targets = [
    { label: ko ? '첫 평가 남기기' : 'Save your first review', current: Math.min(progress?.total ?? 0, 1), total: 1, href: `/${locale}/explore` },
    { label: ko ? '서로 다른 3개 분야 탐험' : 'Explore three categories', current: Math.min(progress?.categoryCount ?? 0, 3), total: 3, href: '#category-stamps' },
  ]
  return <div className="mx-auto max-w-5xl space-y-7 px-4 py-7 sm:px-6 sm:py-10">
    <header className="max-w-2xl">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Compass className="size-7" aria-hidden="true" /></div>
      <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{ko ? '나의 취향 탐험' : 'Your taste journey'}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">{ko ? '한 번의 솔직한 평가가 작은 발자국이 됩니다. 경험한 분야를 모으며 나만의 탐험 노트를 채워보세요.' : 'Each honest review leaves a footprint. Collect the categories you have experienced and build a journey of your own.'}</p>
    </header>

    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="journey-heading">
      <h2 id="journey-heading" className="font-display text-xl font-bold">{ko ? '내가 쌓은 발자국' : 'Your footprints'}</h2>
      {status === 'loading' && <p role="status" className="mt-4 text-sm text-muted-foreground">{ko ? '저장된 평가를 확인하고 있어요…' : 'Checking your saved reviews…'}</p>}
      {status === 'error' && <div className="mt-4 space-y-3"><p role="alert" className="text-sm text-muted-foreground">{ko ? '진척을 확인하지 못했어요. 다시 시도해주세요.' : 'Could not check your progress. Please try again.'}</p><button type="button" onClick={retry} className={`${actionClass} border border-border hover:bg-muted`}><RefreshCw className="size-4" aria-hidden="true" />{ko ? '다시 시도' : 'Try again'}</button></div>}
      {status === 'guest' && <div className="mt-4 space-y-4"><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{ko ? '둘러보기는 지금 바로. 로그인 후 평가를 저장하면 탐험 단계와 도장이 여기에 쌓여요.' : 'Start exploring now. Sign in and save reviews to collect stamps and unlock explorer stages here.'}</p><Link href={`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/play`)}`} className={`${actionClass} bg-primary text-primary-foreground hover:bg-primary/90`}>{ko ? '로그인하고 기록하기' : 'Sign in to collect'}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>}
      {progress && <div className="mt-5 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{ko ? '탐험 단계' : 'Explorer stage'} {progress.stageIndex + 1}</p><p className="mt-1 font-display text-2xl font-bold">{ko ? progress.stage.ko : progress.stage.en}</p></div><p className="text-sm text-muted-foreground"><strong className="font-mono text-3xl text-foreground">{progress.total}</strong> {ko ? '개의 평가' : 'saved reviews'}</p></div>
        <div><progress value={progress.stagePercent} max={100} className="h-3 w-full overflow-hidden rounded-full accent-primary" aria-label={ko ? '다음 탐험 단계 진척' : 'Progress to next explorer stage'} /><p className="mt-2 text-sm text-muted-foreground">{progress.nextStage ? (ko ? `평가 ${progress.nextStage.minimum - progress.total}개를 더 남기면 ‘${progress.nextStage.ko}’` : `${progress.nextStage.minimum - progress.total} more reviews to become ${progress.nextStage.en}`) : (ko ? '모든 탐험 단계를 채웠어요. 다음 경험도 기록해보세요.' : 'Every explorer stage unlocked. Keep collecting your experiences.')}</p></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><span className="inline-flex items-center gap-2"><Stamp className="size-4 text-primary" aria-hidden="true" />{ko ? `분야 도장 ${progress.categoryCount}/6` : `${progress.categoryCount}/6 category stamps`}</span><span className="inline-flex items-center gap-2"><Flame className="size-4 text-primary" aria-hidden="true" />{ko ? `${progress.streak}일 연속 평가` : `${progress.streak}-day review streak`}</span></div>
      </div>}
      <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">{ko ? '서로 다른 대상에 남긴 현재 평가로 계산합니다. 수정·새로고침은 진척을 늘리지 않으며, 삭제한 평가는 제외됩니다. 프로필 등급·업적과는 별도의 탐험 기록입니다.' : 'Based on your current reviews of different subjects. Edits and refreshes add no progress; deleted reviews are excluded. This journey is separate from profile ranks and achievements.'}</p>
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <DiscoveryCard locale={locale} />
      <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7" aria-labelledby="mission-heading">
        <div className="flex items-center gap-2"><Flag className="size-5 text-primary" aria-hidden="true" /><h2 id="mission-heading" className="font-display text-xl font-bold">{ko ? '작은 도전부터' : 'Start with a small challenge'}</h2></div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ko ? '직접 경험한 대상에 솔직한 평가를 남겨주세요. 높은 점수일 필요는 없어요.' : 'Review what you have actually experienced. Your rating does not have to be high.'}</p>
        <ul className="mt-4 divide-y divide-border">{targets.map(target => <li key={target.href} className="py-4"><Link href={target.href} className="flex min-h-11 items-center justify-between gap-3 rounded-lg text-sm font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span>{target.label}</span>{status === 'ready' ? <span className="inline-flex shrink-0 items-center gap-2 font-mono">{target.current === target.total && <Check className="size-4 text-primary" aria-label={ko ? '완료' : 'Complete'} />}{target.current}/{target.total}</span> : <ArrowRight className="size-4 shrink-0" aria-hidden="true" />}</Link></li>)}</ul>
        {progress && <div className="mt-2 border-t border-border pt-4"><p className="text-xs text-muted-foreground">{ko ? '오늘의 미션 · 한국시간 자정 기준' : 'Daily challenge · resets at midnight KST'}</p><Link href={`/${locale}/explore?category=${progress.dailyMission.slug}`} className="mt-1 flex min-h-11 items-center justify-between gap-3 rounded-lg text-sm font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><span>{ko ? `${progress.dailyMission.ko} 1개 평가하기` : `Review one in ${progress.dailyMission.en}`}</span>{progress.dailyCompleted ? <Check className="size-5 shrink-0 text-primary" aria-label={ko ? '완료' : 'Complete'} /> : <ArrowRight className="size-4 shrink-0" aria-hidden="true" />}</Link></div>}
      </section>
    </div>

    <section id="category-stamps" className="scroll-mt-24" aria-labelledby="stamps-heading">
      <div className="mb-4"><h2 id="stamps-heading" className="font-display text-xl font-bold">{ko ? '여섯 분야, 여섯 개의 도장' : 'Six categories. Six stamps.'}</h2><p className="mt-2 text-sm text-muted-foreground">{ko ? '한 분야에 첫 평가를 저장하면 도장이 채워져요.' : 'Save your first review in a category to fill its stamp.'}</p></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{EXPLORER_CATEGORIES.map(category => {
        const Icon = categoryIcons[category.slug]
        const count = progress?.stamps.find(stamp => stamp.slug === category.slug)?.count ?? 0
        return <Link key={category.slug} href={`/${locale}/explore?category=${category.slug}`} className={`group min-w-0 rounded-2xl border p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${count > 0 ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}>
          <div className="mb-4 flex items-start justify-between"><span className={`flex size-11 items-center justify-center rounded-full ${count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><Icon className="size-5" aria-hidden="true" /></span>{count > 0 && <Check className="size-4 text-primary" aria-hidden="true" />}</div>
          <p className="break-words text-sm font-bold group-hover:text-primary">{ko ? category.ko : category.en}</p><p className="mt-1 text-xs text-muted-foreground">{status !== 'ready' ? (ko ? '둘러보기' : 'Explore') : count > 0 ? (ko ? `도장 획득 · ${count}개` : `Collected · ${count}`) : (ko ? '첫 도장 기다리는 중' : 'First stamp awaits')}</p>
        </Link>
      })}</div>
    </section>
  </div>
}
