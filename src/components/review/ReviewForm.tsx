'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import SubRatingInput from '@/components/review/SubRatingInput'
import ImageUpload, { ImageFile } from '@/components/review/ImageUpload'
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

      {/* Photos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Photos</h2>

        {/* Existing images thumbnails */}
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="existing"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(img.id)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <ImageUpload
          images={images}
          onChange={setImages}
          maxImages={maxImages}
          disabled={submitting}
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
