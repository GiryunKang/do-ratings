'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import SubRatingInput from '@/components/review/SubRatingInput'
import ImageUpload, { ImageFile } from '@/components/review/ImageUpload'
import { calculateOverallRating } from '@/lib/utils/rating'
import { sanitizeText, validateReviewInput } from '@/lib/utils/sanitize'
import { containsProfanity, getProfanityWarning } from '@/lib/utils/profanity'

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
  readOnly?: boolean
}

interface ExistingImage {
  id: string
  url: string
  storage_path: string
}

export default function ReviewForm({
  subjectId,
  criteria,
  locale,
  existingReview,
  readOnly = false,
}: ReviewFormProps) {
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const router = useRouter()

  const [title, setTitle] = useState(existingReview?.title ?? '')
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [subRatings, setSubRatings] = useState<Record<string, number>>(
    existingReview?.sub_ratings ?? {}
  )
  const [images, setImages] = useState<ImageFile[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [directRating, setDirectRating] = useState(existingReview?.overall_rating ?? 0)
  const [photoUrl, setPhotoUrl] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [countryCode, setCountryCode] = useState<string>('XX')

  useEffect(() => {
    fetch('/api/geo')
      .then((res) => res.json())
      .then((data) => { if (data.country) setCountryCode(data.country) })
      .catch(() => { /* ignore — defaults to 'XX' */ })
  }, [])

  useEffect(() => {
    if (!existingReview) return

    const supabase = createClient()
    supabase
      .from('review_images')
      .select('id, url, storage_path')
      .eq('review_id', existingReview.id)
      .then(({ data }) => {
        if (data) setExistingImages(data as ExistingImage[])
      })
  }, [existingReview])

  function handleRemoveExistingImage(id: string) {
    setRemovedImageIds((prev) => [...prev, id])
    setExistingImages((prev) => prev.filter((img) => img.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (readOnly) {
      window.location.href = `/${locale}/auth/login?redirect=/${locale}/write/${subjectId}`
      return
    }
    setError(null)

    const cleanTitle = sanitizeText(title)
    const cleanContent = sanitizeText(content)

    const validationError = validateReviewInput(cleanTitle, cleanContent)
    if (validationError) {
      setError(validationError)
      return
    }

    if (containsProfanity(cleanTitle) || containsProfanity(cleanContent)) {
      setError(getProfanityWarning(locale))
      return
    }

    const overallRating = directRating
    if (overallRating === 0) {
      setError(locale === 'ko' ? '평점을 선택해주세요' : 'Please select a rating')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      let reviewId: string

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
        reviewId = existingReview.id

        // Delete removed images from Storage and DB
        if (removedImageIds.length > 0) {
          const { data: removedRows } = await supabase
            .from('review_images')
            .select('storage_path')
            .in('id', removedImageIds)

          if (removedRows && removedRows.length > 0) {
            const storagePaths = removedRows.map((r: { storage_path: string }) => r.storage_path)
            await supabase.storage.from('review-images').remove(storagePaths)
          }

          await supabase.from('review_images').delete().in('id', removedImageIds)
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: insertedReview, error: insertError } = await supabase
          .from('reviews')
          .insert({
            subject_id: subjectId,
            user_id: user.id,
            title: cleanTitle,
            content: cleanContent,
            sub_ratings: subRatings,
            overall_rating: overallRating,
            country_code: countryCode !== 'XX' ? countryCode : null,
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        reviewId = insertedReview.id

        // Upload new images for new review
        if (images.length > 0) {
          const uploadedImages = await Promise.all(
            images.map(async (img) => {
              const storagePath = `${user.id}/${reviewId}/${crypto.randomUUID()}.webp`
              const { error: uploadError } = await supabase.storage
                .from('review-images')
                .upload(storagePath, img.file, { contentType: 'image/webp' })
              if (uploadError) throw uploadError

              const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-images/${storagePath}`
              return { review_id: reviewId, url: storageUrl, storage_path: storagePath }
            })
          )

          const { error: imageInsertError } = await supabase
            .from('review_images')
            .insert(uploadedImages)
          if (imageInsertError) throw imageInsertError
        }
      }

      // Upload new images for existing review edits
      if (existingReview && images.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const uploadedImages = await Promise.all(
          images.map(async (img) => {
            const storagePath = `${user.id}/${reviewId}/${crypto.randomUUID()}.webp`
            const { error: uploadError } = await supabase.storage
              .from('review-images')
              .upload(storagePath, img.file, { contentType: 'image/webp' })
            if (uploadError) throw uploadError

            const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-images/${storagePath}`
            return { review_id: reviewId, url: storageUrl, storage_path: storagePath }
          })
        )

        const { error: imageInsertError } = await supabase
          .from('review_images')
          .insert(uploadedImages)
        if (imageInsertError) throw imageInsertError
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

  const maxImages = 5 - existingImages.length + removedImageIds.length

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 relative overflow-hidden">
        {/* Confetti particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              opacity: 0,
              x: (Math.random() - 0.5) * 300,
              y: -(Math.random() * 200 + 50),
              scale: Math.random() * 0.5 + 0.5,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: Math.random() * 0.3,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              left: '50%',
              top: '40%',
              width: 8 + Math.random() * 8,
              height: 8 + Math.random() * 8,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              background: ['#facc15', '#f59e0b', '#f97316', '#ec4899', '#10b981', '#3b82f6'][Math.floor(Math.random() * 6)],
            }}
          />
        ))}

        {/* Success icon with pop */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center z-10"
        >
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-foreground font-bold text-lg z-10"
        >
          {locale === 'ko' ? '리뷰가 등록되었습니다! 🎉' : 'Review submitted! 🎉'}
        </motion.p>
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          href={`/${locale}/subject/${subjectId}`}
          className="mt-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/80 transition-colors z-10"
        >
          {locale === 'ko' ? '내 리뷰 보러가기 →' : 'View my review →'}
        </motion.a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 [&>*]:relative [&>*]:z-auto">
      {/* Overall Rating */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-base font-bold text-foreground mb-4">{locale === 'ko' ? '평점' : 'Rating'}</h2>
        <div className="flex items-center gap-3 justify-center">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setDirectRating(star)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <svg className={`w-10 h-10 ${star <= directRating ? 'text-primary' : 'text-muted-foreground/30'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
          <span className="text-2xl font-bold text-foreground ml-2">{directRating > 0 ? directRating.toFixed(1) : '-'}</span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {locale === 'ko' ? '별을 탭하여 평점을 선택하세요' : 'Tap a star to rate'}
        </p>
      </div>

      {/* Title */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">{t('title')}</label>
          <span className={`text-xs ${title.length > 100 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {title.length}/100
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          maxLength={100}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground/80">{t('content')}</label>
          <span className={`text-xs ${content.length > 5000 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {content.length}/5000
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          rows={6}
          maxLength={5000}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Photo URL */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {locale === 'ko' ? '사진 URL (선택)' : 'Photo URL (optional)'}
        </h2>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder={locale === 'ko' ? 'https://... 이미지 주소를 붙여넣으세요' : 'https://... Paste image URL'}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {photoUrl && (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          {locale === 'ko'
            ? '💡 인터넷에서 이미지 주소를 복사하여 붙여넣으세요. 저작권에 문제없는 이미지만 사용해주세요.'
            : '💡 Copy an image URL from the internet. Only use copyright-free images.'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Disclaimer agreement */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 overflow-hidden">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-amber-300 text-primary focus:ring-primary"
          />
          <span className="text-xs text-amber-800 leading-relaxed">
            {locale === 'ko'
              ? '본 리뷰는 개인적인 의견이며, 타인의 명예를 훼손하거나 허위 사실을 유포하지 않겠습니다. 비방, 욕설, 차별적 표현이 포함된 리뷰는 삭제될 수 있으며, 법적 책임은 작성자 본인에게 있습니다. 한국 연예인에 대한 평가는 플랫폼 정책에 따라 제한됩니다.'
              : 'This review reflects my personal opinion. I will not defame others or spread false information. Reviews containing slander, profanity, or discriminatory language may be removed, and I accept legal responsibility for my content. Ratings of Korean celebrities are restricted under our platform policy.'}
          </span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-3 relative z-50 mt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {tCommon('cancel')}
        </button>
        <button
          type="submit"
          disabled={!readOnly && (submitting || !agreed)}
          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {readOnly
            ? (locale === 'ko' ? '로그인하고 제출하기' : 'Sign in & Submit')
            : submitting ? tCommon('loading') : t('submit')}
        </button>
      </div>
    </form>
  )
}
