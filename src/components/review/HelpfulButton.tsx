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
  const [bouncing, setBouncing] = useState(false)
  const [glowing, setGlowing] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const isDisabled =
    !currentUserId || currentUserId === reviewUserId || pending

  async function toggle() {
    if (isDisabled) return
    setBouncing(true)
    setTimeout(() => setBouncing(false), 300)
    setPending(true)
    const supabase = createClient()

    setMutationError(null)
    try {
      if (helpful) {
        const { error } = await supabase
          .from('helpful_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', currentUserId!)
        if (error) throw error
        setHelpful(false)
        setCount((c) => c - 1)
      } else {
        const { error } = await supabase
          .from('helpful_votes')
          .insert({ review_id: reviewId, user_id: currentUserId! })
        if (error) throw error
        setHelpful(true)
        setCount((c) => c + 1)
        setGlowing(true)
        setTimeout(() => setGlowing(false), 600)
      }
    } catch (err) {
      console.error('helpful vote error:', err)
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
          helpful
            ? 'bg-primary/10 border-primary text-primary'
            : 'border-border text-muted-foreground hover:border-border hover:text-foreground/80'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{
          transform: bouncing ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.3s',
          ...(glowing ? { boxShadow: '0 0 16px rgba(250, 204, 21, 0.6)' } : {}),
        }}
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
      {mutationError && (
        <span className="text-[10px] text-red-500 px-1">{mutationError}</span>
      )}
    </div>
  )
}
