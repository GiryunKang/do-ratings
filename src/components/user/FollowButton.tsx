'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}

export default function FollowButton({ targetUserId, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const t = useTranslations('user')
  const { user } = useAuth()
  const [following, setFollowing] = useState(initialIsFollowing)
  const [pending, setPending] = useState(false)

  const isOwnProfile = user?.id === targetUserId
  const isDisabled = !user || isOwnProfile || pending

  async function handleToggle() {
    if (isDisabled) return
    setPending(true)

    // Optimistic update
    setFollowing((prev) => !prev)

    const supabase = createClient()

    try {
      if (following) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user!.id)
          .eq('following_id', targetUserId)
        if (error) console.error('[FollowButton] delete error:', error.message)
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user!.id, following_id: targetUserId })
        if (error) console.error('[FollowButton] insert error:', error.message)
      }
    } catch {
      // Revert on error
      setFollowing((prev) => !prev)
    } finally {
      setPending(false)
    }
  }

  if (isOwnProfile) return null

  return (
    <button
      onClick={handleToggle}
      disabled={isDisabled}
      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        following
          ? 'bg-muted text-foreground/80 border border-border hover:bg-red-50 dark:bg-red-950/30 hover:text-red-600 hover:border-red-300'
          : 'bg-foreground text-background hover:opacity-90'
      }`}
    >
      {following ? t('unfollow') : t('follow')}
    </button>
  )
}
