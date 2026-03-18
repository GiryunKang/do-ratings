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

  const isDisabled = !currentUserId || currentUserId === reviewUserId || pending

  async function toggle() {
    if (isDisabled) return
    setPending(true)
    const supabase = createClient()

    try {
      if (isNotHelpful) {
        await supabase
          .from('not_helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', currentUserId!)
        setIsNotHelpful(false)
        setCount((c) => c - 1)
      } else {
        await supabase
          .from('not_helpful_votes')
          .insert({ review_id: reviewId, user_id: currentUserId! })
        setIsNotHelpful(true)
        setCount((c) => c + 1)
      }
    } catch {
      // Revert on error — state unchanged
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isDisabled}
      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
        isNotHelpful
          ? 'bg-red-50 border-red-300 text-red-600'
          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
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
  )
}
