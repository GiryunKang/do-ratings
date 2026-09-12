'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sanitizeText, validateReviewInput } from '@/lib/utils/sanitize'
import { containsProfanity, getProfanityWarning } from '@/lib/utils/profanity'
import { displayRating } from '@/lib/utils/rating'
import { adoptGuestDraft, beginDraftTransfer, clearDraft, draftKey, readDraft, saveDraft } from '@/lib/utils/draft'
import { reviewSubRatings, savedRatingMatches } from '@/lib/utils/review-save'
import StarRating from './StarRating'
import { useAuth } from '@/lib/hooks/useAuth'

interface Criterion { key: string; ko: string; en: string }
interface ExistingReview { id: string; title: string; content: string; sub_ratings: Record<string, number>; overall_rating: number }
interface ReviewFormProps {
  subjectId: string; criteria: Criterion[]; locale: string; existingReview?: ExistingReview;
  readOnly?: boolean; initialRating?: number; userId?: string | null
}

export default function ReviewForm({ subjectId, locale, existingReview, readOnly = false, initialRating, userId }: ReviewFormProps) {
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { user: activeUser, loading: authLoading } = useAuth()
  const ko = locale === 'ko'
  const [title, setTitle] = useState(existingReview?.title ?? '')
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [directRating, setDirectRating] = useState(existingReview?.overall_rating ?? initialRating ?? 0)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState<{ id: string; verified: boolean } | null>(null)
  const [draftStatus, setDraftStatus] = useState('')
  const [ready, setReady] = useState(false)
  const [countryCode, setCountryCode] = useState('XX')
  const keyRef = useRef<string | null>(null)
  const submitLock = useRef(false)
  const successRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    fetch('/api/geo').then(res => res.json()).then(data => { if (data.country) setCountryCode(data.country) }).catch(() => {})
  }, [])

  useEffect(() => {
    try {
      keyRef.current = draftKey(subjectId, userId)
      const transferred = userId ? adoptGuestDraft(subjectId, userId, !!existingReview) : null
      const draft = existingReview ? null : transferred ?? readDraft(keyRef.current)
      if (draft) {
        setTitle(draft.title)
        setContent(draft.content)
        setDirectRating(draft.rating)
        setDraftStatus(ko ? '이 탭에 보관한 초안을 불러왔어요.' : 'Your draft from this tab has been restored.')
      }
    } catch {
      setDraftStatus(ko ? '이 브라우저에서는 초안을 보관할 수 없어요.' : 'Draft storage is unavailable in this browser.')
    }
    setReady(true)
  }, [subjectId, userId, existingReview, ko])

  useEffect(() => {
    if (!ready || saved || !keyRef.current || existingReview) return
    if (!title && !content && !directRating) { clearDraft(keyRef.current); return }
    const stored = saveDraft(keyRef.current, { title, content, rating: directRating, updatedAt: Date.now() })
    if (!stored) setDraftStatus(ko ? '초안을 보관하지 못했어요. 이 탭을 닫기 전에 내용을 복사해주세요.' : 'Your draft could not be saved. Copy your text before closing this tab.')
  }, [title, content, directRating, ready, saved, existingReview, ko])

  useEffect(() => { if (saved) successRef.current?.focus() }, [saved])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitLock.current || saved) return
    setError(null)
    if (readOnly) {
      if (keyRef.current) saveDraft(keyRef.current, { title, content, rating: directRating, updatedAt: Date.now() })
      beginDraftTransfer(subjectId)
      const destination = `/${locale}/write/${subjectId}${directRating ? `?rating=${directRating * 2}` : ''}`
      router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(destination)}`)
      return
    }
    const cleanTitle = sanitizeText(title)
    const cleanContent = sanitizeText(content)
    const validationError = validateReviewInput(cleanTitle, cleanContent)
    if (validationError) {
      setError(ko ? (!cleanTitle ? '평가 제목을 입력해주세요.' : !cleanContent ? '평가 내용을 입력해주세요.' : '제목은 100자, 내용은 5,000자 이내로 입력해주세요.') : validationError)
      return
    }
    if (containsProfanity(cleanTitle) || containsProfanity(cleanContent)) { setError(getProfanityWarning(locale)); return }
    if (directRating < 1 || directRating > 5 || directRating % 0.5 !== 0) { setError(ko ? '평점을 선택해주세요.' : 'Please select a rating.'); return }
    if (!agreed) { setError(ko ? '작성 안내를 확인해주세요.' : 'Please confirm the review guidelines.'); return }
    submitLock.current = true
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) throw new Error(ko ? '로그인 상태가 변경됐어요. 내용을 복사한 뒤 다시 로그인해주세요.' : 'Your sign-in session changed. Copy your draft and sign in again.')
      const payload = { title: cleanTitle, content: cleanContent, overall_rating: directRating, sub_ratings: reviewSubRatings(directRating, existingReview?.sub_ratings) }
      const result = existingReview
        ? await supabase.from('reviews').update(payload).eq('id', existingReview.id).eq('user_id', user.id).select('id, overall_rating').single()
        : await supabase.from('reviews').insert({ ...payload, subject_id: subjectId, user_id: user.id, country_code: countryCode !== 'XX' ? countryCode : null }).select('id, overall_rating').single()
      if (result.error) throw result.error
      if (!result.data) throw new Error(ko ? '저장 결과를 확인할 수 없어요. 잠시 후 내 리뷰를 확인해주세요.' : 'Unable to confirm the save. Please check your reviews.')
      const verified = savedRatingMatches(result.data.overall_rating, directRating)
      setSaved({ id: result.data.id, verified })
      if (verified) {
        if (keyRef.current) clearDraft(keyRef.current)
        window.dispatchEvent(new Event('ratings:review-saved'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ko ? '저장하지 못했어요. 입력 내용은 유지됩니다. 다시 시도해주세요.' : 'Unable to save. Your input is preserved. Please try again.')
      submitLock.current = false
    } finally { setSubmitting(false) }
  }

  if (!authLoading && (activeUser?.id ?? null) !== (userId ?? null)) return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p role="status">{ko ? '로그인 계정이 변경됐어요. 현재 계정으로 작성 화면을 다시 불러오세요.' : 'Your account changed. Reload the editor for your current account.'}</p>
      <button type="button" onClick={() => router.refresh()} className="min-h-11 rounded-xl bg-primary px-4 py-3 text-primary-foreground">{ko ? '작성 화면 새로고침' : 'Reload editor'}</button>
    </section>
  )

  if (saved) return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-8 space-y-5" aria-labelledby="review-saved-title">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-foreground" aria-hidden="true">
        {saved.verified ? <Check className="h-6 w-6 motion-safe:animate-fadeIn" /> : <AlertCircle className="h-6 w-6" />}
      </div>
      <h2 ref={successRef} tabIndex={-1} id="review-saved-title" className="text-2xl font-bold outline-none">
        {saved.verified ? (ko ? '평가를 저장했어요' : 'Your review is saved') : (ko ? '저장된 점수 확인이 필요해요' : 'Your saved rating needs checking')}
      </h2>
      <p className="text-sm text-muted-foreground" role="status">
        {saved.verified ? (ko ? '솔직한 경험을 나눠주셔서 감사합니다. 내 기록에서 다시 볼 수 있어요.' : 'Thank you for sharing your experience. You can revisit it in your reviews.') : (ko ? '리뷰는 저장됐지만 선택한 점수와 서버의 점수가 다릅니다. 중복 제출하지 말고 저장된 리뷰를 확인해주세요. 초안은 이 탭에 유지됩니다.' : 'The review was saved, but its rating differs from your selection. Check the saved review before submitting again. Your draft remains in this tab.')}
      </p>
      <p className="font-mono text-2xl font-bold">{displayRating(directRating)} <span className="text-sm font-normal text-muted-foreground">/ 10 · {ko ? '내가 선택한 점수' : 'Your selection'}</span></p>
      <div className="flex flex-col gap-3">
        <Link href={`/${locale}/subject/${subjectId}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">{ko ? '저장한 리뷰 보기' : 'View saved review'}</Link>
        <Link href={`/${locale}/play`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-semibold">{ko ? '내 탐험 기록' : 'My exploration'}</Link>
      </div>
    </section>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={submitting}>
      <fieldset disabled={submitting || !ready} className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
        <legend className="px-1 text-base font-bold">{ko ? '내 평점' : 'Your rating'}</legend>
        <div className="flex flex-col items-center gap-3">
          <StarRating value={directRating} onChange={setDirectRating} size="lg" locale={locale} disabled={submitting || !ready} />
          <output className="text-2xl font-bold font-mono" aria-live="polite">{displayRating(directRating)} <span className="text-sm font-normal text-muted-foreground">/ 10</span></output>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">{ko ? '별 1개는 2점이에요. 별을 누르거나 방향키로 선택하세요.' : 'Each star equals 2 points. Select a star or use the arrow keys.'}</p>
        {existingReview && Object.keys(existingReview.sub_ratings).some(key => key !== 'overall') && <p className="mt-3 text-xs text-muted-foreground">{ko ? '이 화면에서는 종합 점수만 수정합니다. 기존 세부 평가는 유지됩니다.' : 'This form updates your overall rating. Existing detailed ratings are preserved.'}</p>}
      </fieldset>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2"><label htmlFor="review-title" className="text-sm font-semibold">{t('title')}</label><span className="text-xs text-muted-foreground">{title.length}/100</span></div>
        <input id="review-title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} maxLength={100} disabled={submitting || !ready} className="w-full min-h-11 rounded-xl border border-border bg-card px-3 py-3 text-base" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2"><label htmlFor="review-content" className="text-sm font-semibold">{t('content')}</label><span className="text-xs text-muted-foreground">{content.length}/5000</span></div>
        <textarea id="review-content" value={content} onChange={e => setContent(e.target.value)} placeholder={t('contentPlaceholder')} rows={6} maxLength={5000} disabled={submitting || !ready} className="w-full rounded-xl border border-border bg-card px-3 py-3 text-base resize-y" />
      </div>
      {!existingReview && <p className="text-xs text-muted-foreground" role="status">{draftStatus || (ko ? '초안은 이 브라우저 탭에 최대 24시간 보관됩니다.' : 'Drafts stay in this browser tab for up to 24 hours.')}</p>}
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <label className="flex min-h-11 items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} disabled={submitting} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
          <span className="text-xs text-muted-foreground leading-relaxed">{ko ? '본 리뷰는 개인적인 의견이며, 타인의 명예를 훼손하거나 허위 사실을 유포하지 않겠습니다. 비방, 욕설, 차별적 표현이 포함된 리뷰는 삭제될 수 있으며, 법적 책임은 작성자 본인에게 있습니다. 한국 연예인에 대한 평가는 플랫폼 정책에 따라 제한됩니다.' : 'This review reflects my personal opinion. I will not defame others or spread false information. Reviews containing slander, profanity, or discriminatory language may be removed, and I accept legal responsibility for my content. Ratings of Korean celebrities are restricted under our platform policy.'}</span>
        </label>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button type="button" onClick={() => router.back()} disabled={submitting} className="min-h-11 flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium">{tCommon('cancel')}</button>
        <button type="submit" disabled={!ready || submitting || (!readOnly && !agreed)} className="min-h-11 flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed">
          {readOnly ? (ko ? '로그인하고 이어 쓰기' : 'Sign in to continue') : submitting ? (ko ? '저장 중…' : 'Saving…') : t('submit')}
        </button>
      </div>
    </form>
  )
}
