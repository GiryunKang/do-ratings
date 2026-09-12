'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Compass, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { displayRating } from '@/lib/utils/rating'

interface Estimate { userId: string; subjectId: string; subjectName: string; rating: number; sample: number }

export default function RatingPrediction({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!userId || authLoading) return
    let cancelled = false
    async function load() {
      setStatus('loading')
      setEstimate(null)
      setRevealed(false)
      try {
        const supabase = createClient()
        const { data: reviews, error } = await supabase.from('reviews').select('overall_rating').eq('user_id', userId!).eq('is_deleted', false).order('created_at', { ascending: false }).limit(50)
        if (cancelled) return
        if (error) throw error
        if (!reviews || reviews.length < 2) { setStatus('ready'); return }
        const { data: subjects, error: subjectError } = await supabase.from('subjects').select('id, name, avg_rating').not('avg_rating', 'is', null).order('review_count', { ascending: false }).limit(30)
        if (cancelled) return
        if (subjectError) throw subjectError
        const picked = subjects?.[Math.floor(Math.random() * (subjects?.length ?? 0))]
        if (picked) {
          const average = reviews.reduce((sum, review) => sum + Number(review.overall_rating), 0) / reviews.length
          const rating = Math.min(5, Math.max(1, average * 0.6 + Number(picked.avg_rating) * 0.4))
          const name = picked.name as Record<string, string>
          setEstimate({ userId: userId!, subjectId: picked.id, subjectName: name[locale] ?? name.ko ?? name.en ?? '', rating, sample: reviews.length })
        }
        setStatus('ready')
      } catch { if (!cancelled) setStatus('error') }
    }
    void load()
    return () => { cancelled = true }
  }, [userId, authLoading, locale, attempt])
  if (!userId || authLoading) return null
  const current = estimate?.userId === userId ? estimate : null
  if (status === 'ready' && !current) return null
  return <section className="rounded-xl border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 text-sm font-bold"><Compass className="size-4 text-primary" aria-hidden="true" />{ko ? '취향 점수 가늠하기' : 'A taste estimate'}</h2>
    {status === 'loading' && <p role="status" className="mt-3 text-sm text-muted-foreground">{ko ? '최근 평가 확인 중…' : 'Checking recent reviews…'}</p>}
    {status === 'error' && <div className="mt-3"><p role="alert" className="text-sm text-muted-foreground">{ko ? '점수를 불러오지 못했어요.' : 'Could not load the estimate.'}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><RefreshCw className="size-4" aria-hidden="true" />{ko ? '다시 시도' : 'Try again'}</button></div>}
    {status === 'ready' && current && <><p className="mt-3 font-bold">{current.subjectName}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ko ? `최근 평가 ${current.sample}개의 평균 60%와 이 대상의 전체 평균 40%를 섞은 가벼운 예상이에요.` : `A simple estimate: 60% of your latest ${current.sample} reviews' average and 40% of this subject's average.`}</p>{revealed ? <div className="mt-4" aria-live="polite"><p className="font-mono text-2xl font-bold text-primary">{displayRating(current.rating)} <span className="text-sm text-muted-foreground">/ 10</span></p><Link href={`/${locale}/subject/${current.subjectId}`} className="mt-3 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary">{ko ? '내 경험과 비교하기' : 'Compare your experience'}</Link></div> : <button type="button" onClick={() => setRevealed(true)} className="mt-4 min-h-11 w-full rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary">{ko ? '예상 점수 보기' : 'Reveal the estimate'}</button>}</>}
  </section>
}
