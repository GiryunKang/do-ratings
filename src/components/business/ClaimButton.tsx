'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

interface ClaimButtonProps {
  subjectId: string
  currentUserId: string | null
  locale: string
}

type ClaimStatus = 'none' | 'pending' | 'approved' | 'rejected'

export default function ClaimButton({
  subjectId,
  currentUserId,
  locale: _locale,
}: ClaimButtonProps) {
  const t = useTranslations('business')
  const tCommon = useTranslations('common')
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('none')
  const [showForm, setShowForm] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessEmail, setBusinessEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClaim = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('business_claims')
        .select('verification_status')
        .eq('subject_id', subjectId)
        .maybeSingle()

      if (data) {
        setClaimStatus(data.verification_status as ClaimStatus)
      } else {
        setClaimStatus('none')
      }
      setLoading(false)
    }

    fetchClaim()
  }, [subjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !businessName.trim() || !businessEmail.trim() || submitting) return
    setSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.from('business_claims').insert({
      subject_id: subjectId,
      user_id: currentUserId,
      business_name: businessName.trim(),
      business_email: businessEmail.trim(),
    })

    if (!error) {
      setClaimStatus('pending')
      setShowForm(false)
    }
    setSubmitting(false)
  }

  if (loading) return null

  if (claimStatus === 'approved') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full text-sm font-medium text-green-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-green-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.491 4.491 0 01-3.497-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.492 4.492 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
            clipRule="evenodd"
          />
        </svg>
        {t('claimApproved')}
      </div>
    )
  }

  if (claimStatus === 'pending') {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full text-sm text-muted-foreground cursor-not-allowed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {t('claimPending')}
      </button>
    )
  }

  if (!currentUserId) return null

  return (
    <div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-full text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          {t('claimPage')}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="border border-border rounded-xl p-4 bg-muted/50 space-y-3 max-w-sm"
        >
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-1">
              {t('businessName')}
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-1">
              {t('businessEmail')}
            </label>
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              required
              className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 text-sm bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('submitClaim')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-muted-foreground hover:text-foreground/80 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
