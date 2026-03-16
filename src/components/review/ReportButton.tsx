'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface ReportButtonProps {
  reviewId: string
}

const REASONS = ['spam', 'abuse', 'inappropriate', 'fake'] as const
type Reason = typeof REASONS[number]

export default function ReportButton({ reviewId }: ReportButtonProps) {
  const t = useTranslations('report')
  const tCommon = useTranslations('common')
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!reason || !user) return
    setSubmitting(true)
    const supabase = createClient()
    try {
      await supabase.from('reports').insert({
        review_id: reviewId,
        reporter_id: user.id,
        reason,
        description: description.trim() || null,
      })
      setSubmitted(true)
    } catch {
      // Silently handle
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 9-18 9V3z"
          />
        </svg>
        <span>{tCommon('loading').includes('로딩') ? '신고' : 'Report'}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
            {submitted ? (
              <p className="text-sm text-green-600 text-center py-2">
                Report submitted. Thank you.
              </p>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Report Review
                </h4>

                <div className="space-y-1.5 mb-3">
                  {REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-indigo-600"
                      />
                      <span className="text-sm text-gray-700">
                        {t(r)}
                      </span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('description')}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 mb-3"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason || submitting}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? tCommon('loading') : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
