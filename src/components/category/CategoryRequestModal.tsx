'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface CategoryRequestModalProps {
  locale: string
  onClose: () => void
}

export default function CategoryRequestModal({ locale, onClose }: CategoryRequestModalProps) {
  const { user } = useAuth()
  const isKo = locale === 'ko'
  const overlayRef = useRef<HTMLDivElement>(null)

  const [nameKo, setNameKo] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [iconSuggestion, setIconSuggestion] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameKo.trim()) {
      setError(isKo ? '카테고리 이름 (한국어)을 입력해 주세요.' : 'Please enter the Korean category name.')
      return
    }
    // 영어 이름은 선택사항
    if (!user) {
      setError(isKo ? '로그인이 필요합니다.' : 'You must be logged in.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: insertError } = await supabase.from('category_requests').insert({
        user_id: user.id,
        name_ko: nameKo.trim(),
        name_en: nameEn.trim(),
        icon_suggestion: iconSuggestion.trim() || null,
        reason: reason.trim() || null,
      })

      if (insertError) {
        setError(isKo ? '요청에 실패했습니다.' : 'Failed to submit request.')
        return
      }

      setSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch {
      setError(isKo ? '네트워크 오류가 발생했습니다.' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {isKo ? '카테고리 추가 요청' : 'Request New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground transition-colors p-1 rounded-lg hover:bg-muted"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm font-medium text-foreground/80">
              {isKo ? '요청이 접수되었습니다. 감사합니다!' : 'Your request has been submitted. Thank you!'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Korean name */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {isKo ? '카테고리 이름 (한국어)' : 'Category Name (Korean)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nameKo}
                onChange={e => setNameKo(e.target.value)}
                placeholder={isKo ? '예: 영화' : 'e.g. 영화'}
                required
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* English name */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {isKo ? '카테고리 이름 (영어, 선택)' : 'Category Name (English, optional)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                placeholder={isKo ? '예: Movies (선택)' : 'e.g. Movies (optional)'}
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Icon suggestion */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {isKo ? '아이콘 제안 (선택)' : 'Icon Suggestion (optional)'}
              </label>
              <input
                type="text"
                value={iconSuggestion}
                onChange={e => setIconSuggestion(e.target.value)}
                placeholder={isKo ? '예: 🎬 또는 film' : 'e.g. 🎬 or film'}
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {isKo ? '요청 사유 (선택)' : 'Reason (optional)'}
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={isKo ? '이 카테고리가 필요한 이유를 적어주세요.' : 'Why do you think this category should be added?'}
                rows={3}
                className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted/50 transition-colors"
              >
                {isKo ? '취소' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isKo ? '제출 중...' : 'Submitting...') : (isKo ? '요청하기' : 'Submit Request')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
