'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface HelpfulButtonProps {
  reviewId: string
  initialCount: number
  isHelpful: boolean
  reviewUserId: string
  currentUserId: string | null
}

export default function HelpfulButton({
  reviewId,
  initialCount,
  isHelpful,
  reviewUserId,
  currentUserId,
}: HelpfulButtonProps) {
  const [helpful, setHelpful] = useState(isHelpful)
  const [count, setCount] = useState(initialCount)
  const [pending, setPending] = useState(false)

  const isDisabled =
    !currentUserId || currentUserId === reviewUserId || pending

  async function toggle() {
    if (isDisabled) return
    setPending(true)
    const supabase = createClient()

    try {
      if (helpful) {
        await supabase
          .from('helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', currentUserId!)
        setHelpful(false)
        setCount((c) => c - 1)
      } else {
        await supabase
          .from('helpful_votes')
          .insert({ review_id: reviewId, user_id: currentUserId! })
        setHelpful(true)
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
        helpful
          ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={!currentUserId ? 'Login to mark helpful' : undefined}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill={helpful ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
        />
      </svg>
      <span>{count}</span>
    </button>
  )
}
