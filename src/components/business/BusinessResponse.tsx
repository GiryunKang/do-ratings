'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { timeAgo } from '@/lib/utils/timeAgo'

interface BusinessResponseProps {
  reviewId: string
  subjectId: string
  currentUserId: string | null
  locale: string
}

interface ResponseData {
  id: string
  content: string
  created_at: string
}

export default function BusinessResponse({
  reviewId,
  subjectId,
  currentUserId,
  locale: _locale,
}: BusinessResponseProps) {
  const t = useTranslations('business')
  const tCommon = useTranslations('common')
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [isVerifiedOwner, setIsVerifiedOwner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const [{ data: responseData }, { data: claimData }] = await Promise.all([
      supabase
        .from('business_responses')
        .select('id, content, created_at')
        .eq('review_id', reviewId)
        .maybeSingle(),
      currentUserId
        ? supabase
            .from('business_claims')
            .select('id')
            .eq('subject_id', subjectId)
            .eq('user_id', currentUserId)
            .eq('verification_status', 'approved')
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    if (responseData) setResponse(responseData)
    if (claimData) setIsVerifiedOwner(true)
    setLoading(false)
  }, [reviewId, subjectId, currentUserId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !content.trim() || submitting) return
    setSubmitting(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('business_responses')
      .insert({
        review_id: reviewId,
        user_id: currentUserId,
        content: content.trim(),
      })
      .select('id, content, created_at')
      .single()

    if (!error && data) {
      setResponse(data)
      setShowForm(false)
      setContent('')
    }
    setSubmitting(false)
  }

  if (loading) return null

  return (
    <div className="mt-2">
      {/* Existing response display */}
      {response && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 mt-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-teal-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.491 4.491 0 01-3.497-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.492 4.492 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-semibold text-teal-700">{t('businessResponse')}</span>
            <span className="text-xs text-teal-500 ml-auto">{timeAgo(response.created_at)}</span>
          </div>
          <p className="text-sm text-teal-900 leading-relaxed">{response.content}</p>
        </div>
      )}

      {/* Respond button for verified owner (only if no response yet) */}
      {!response && isVerifiedOwner && (
        <div className="mt-2">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
              {t('respondToReview')}
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="border border-teal-200 rounded-xl bg-teal-50 p-3 space-y-2"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-teal-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.491 4.491 0 01-3.497-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.492 4.492 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-semibold text-teal-700">{t('businessResponse')}</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 1000))}
                rows={3}
                maxLength={1000}
                className="w-full text-sm resize-none rounded-lg border border-teal-200 bg-white px-3 py-2 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200 placeholder-gray-400"
                placeholder=""
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{content.length}/1000</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setContent('')
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!content.trim() || submitting}
                    className="text-sm bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tCommon('save')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
