'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ReactionBarProps {
  reviewId: string
  currentUserId: string | null
  initialReactions: Record<string, number>
  userReaction: string | null
}

const REACTIONS = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'wow', emoji: '😮' },
  { key: 'sad', emoji: '😢' },
  { key: 'angry', emoji: '😡' },
] as const

type ReactionKey = (typeof REACTIONS)[number]['key']

export default function ReactionBar({
  reviewId,
  currentUserId,
  initialReactions,
  userReaction,
}: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<string, number>>(initialReactions)
  const [activeReaction, setActiveReaction] = useState<string | null>(userReaction)
  const [pending, setPending] = useState(false)

  async function handleReaction(key: ReactionKey) {
    if (!currentUserId || pending) return

    const supabase = createClient()
    const isRemoving = activeReaction === key

    // Optimistic update
    const prevCounts = { ...counts }
    const prevActive = activeReaction

    setCounts((prev) => {
      const next = { ...prev }
      if (activeReaction && activeReaction !== key) {
        next[activeReaction] = Math.max(0, (next[activeReaction] ?? 0) - 1)
      }
      if (isRemoving) {
        next[key] = Math.max(0, (next[key] ?? 0) - 1)
      } else {
        next[key] = (next[key] ?? 0) + 1
      }
      return next
    })
    setActiveReaction(isRemoving ? null : key)

    setPending(true)
    try {
      if (isRemoving) {
        await supabase
          .from('review_reactions')
          .delete()
          .eq('user_id', currentUserId)
          .eq('review_id', reviewId)
      } else {
        await supabase.from('review_reactions').upsert(
          { user_id: currentUserId, review_id: reviewId, reaction: key },
          { onConflict: 'user_id,review_id' }
        )
      }
    } catch {
      // Revert on error
      setCounts(prevCounts)
      setActiveReaction(prevActive)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTIONS.map(({ key, emoji }) => {
        const count = counts[key] ?? 0
        const isActive = activeReaction === key
        return (
          <button
            key={key}
            onClick={() => handleReaction(key)}
            disabled={pending}
            title={
              !currentUserId
                ? 'Login to react'
                : isActive
                ? `Remove ${key} reaction`
                : `React with ${key}`
            }
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-colors ${
              isActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            } ${!currentUserId ? 'cursor-default' : 'cursor-pointer'} disabled:opacity-60`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
