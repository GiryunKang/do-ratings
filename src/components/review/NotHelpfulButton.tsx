'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'


interface NotHelpfulButtonProps {
  reviewId: string
  initialCount: number
  isNotHelpful: boolean
  reviewUserId: string
  currentUserId: string | null
}

export default function NotHelpfulButton({
  reviewId,
  initialCount,
  isNotHelpful: initialIsNotHelpful,
  reviewUserId,
  currentUserId,
}: NotHelpfulButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [isNotHelpful, setIsNotHelpful] = useState(initialIsNotHelpful)
  const [pending, setPending] = useState(false)
  const [bouncing, setBouncing] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const isDisabled = !currentUserId || currentUserId === reviewUserId || pending

  async function toggle() {
    if (isDisabled) return
    setBouncing(true)
    setTimeout(() => setBouncing(false), 300)
    setPending(true)
    const supabase = createClient()

    setMutationError(null)
    try {
      if (isNotHelpful) {
        const { error } = await supabase
          .from('not_helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', currentUserId!)
        if (error) throw error
        setIsNotHelpful(false)
        setCount((c) => c - 1)
      } else {
        const { error } = await supabase
          .from('not_helpful_votes')
          .insert({ review_id: reviewId, user_id: currentUserId! })
        if (error) throw error
        setIsNotHelpful(true)
        setCount((c) => c + 1)
      }
    } catch (err) {
      console.error('not helpful vote error:', err)
      setMutationError('요청에 실패했습니다')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        onClick={toggle}
        disabled={isDisabled}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
          isNotHelpful
            ? 'bg-red-50 dark:bg-red-950/30 border-red-300 text-red-600'
            : 'border-border text-muted-foreground hover:border-border hover:text-foreground/80'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ transform: bouncing ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
        title={!currentUserId ? 'Login to mark not helpful' : undefined}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill={isNotHelpful ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"
          />
        </svg>
        <span>{count}</span>
      </button>
      {mutationError && (
        <span className="text-[10px] text-red-500 px-1">{mutationError}</span>
      )}
    </div>
  )
}
