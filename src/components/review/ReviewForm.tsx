'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import SubRatingInput from '@/components/review/SubRatingInput'
import { calculateOverallRating } from '@/lib/utils/rating'
import { sanitizeText, validateReviewInput } from '@/lib/utils/sanitize'

interface Criterion {
  key: string
  ko: string
  en: string
}

interface ExistingReview {
  id: string
  title: string
  content: string
  sub_ratings: Record<string, number>
  overall_rating: number
}

interface ReviewFormProps {
  subjectId: string
  criteria: Criterion[]
  locale: string
  existingReview?: ExistingReview
}

export default function ReviewForm({
  subjectId,
  criteria,
  locale,
  existingReview,
}: ReviewFormProps) {
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const [title, setTitle] = useState(existingReview?.title ?? '')
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [subRatings, setSubRatings] = useState<Record<string, number>>(
    existingReview?.sub_ratings ?? {}
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanTitle = sanitizeText(title)
    const cleanContent = sanitizeText(content)

    const validationError = validateReviewInput(cleanTitle, cleanContent)
    if (validationError) {
      setError(validationError)
      return
    }

    const overallRating = calculateOverallRating(subRatings)
    if (overallRating === 0) {
      setError('Please provide at least one sub-rating')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      if (existingReview) {
        const { error: updateError } = await supabase
          .from('reviews')
          .update({
            title: cleanTitle,
            content: cleanContent,
            sub_ratings: subRatings,
            overall_rating: overallRating,
          })
          .eq('id', existingReview.id)

        if (updateError) throw updateError
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error: insertError } = await supabase
          .from('reviews')
          .insert({
            subject_id: subjectId,
            user_id: user.id,
            title: cleanTitle,
            content: cleanContent,
            sub_ratings: subRatings,
            overall_rating: overallRating,
          })

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/subject/${subjectId}`)
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">Review submitted!</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sub Ratings */}
      {criteria.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ratings</h2>
          <SubRatingInput
            criteria={criteria}
            values={subRatings}
            onChange={setSubRatings}
            locale={locale}
          />
        </div>
      )}

      {/* Title */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700">{t('title')}</label>
          <span className={`text-xs ${title.length > 100 ? 'text-red-500' : 'text-gray-400'}`}>
            {title.length}/100
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700">{t('content')}</label>
          <span className={`text-xs ${content.length > 5000 ? 'text-red-500' : 'text-gray-400'}`}>
            {content.length}/5000
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          rows={6}
          maxLength={5000}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? tCommon('loading') : t('submit')}
        </button>
      </div>
    </form>
  )
}
