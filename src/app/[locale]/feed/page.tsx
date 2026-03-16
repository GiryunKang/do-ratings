'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { encodeCursor, decodeCursor } from '@/lib/utils/cursor'
import InfiniteScroll from '@/components/ui/InfiniteScroll'
import ReviewCard from '@/components/review/ReviewCard'
import { useEffect } from 'react'

interface FeedReview {
  id: string
  user: {
    id: string
    nickname: string
    level: 'bronze' | 'silver' | 'gold' | 'platinum'
    avatar_url: string | null
  }
  subject_id: string
  overall_rating: number
  title: string
  content: string
  helpful_count: number
  created_at: string
  is_helpful: boolean
}

const PAGE_SIZE = 10

function FeedContent({ userId }: { userId: string }) {
  const tCommon = useTranslations('common')

  const fetchFeed = useCallback(
    async (cursor: string | null) => {
      const supabase = createClient()

      // Get following IDs
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (!follows || follows.length === 0) {
        return { data: [], nextCursor: null }
      }

      const followingIds = follows.map((f) => f.following_id)

      let query = supabase
        .from('reviews')
        .select(`
          id,
          overall_rating,
          title,
          content,
          helpful_count,
          created_at,
          subject_id,
          user_id,
          public_profiles(id, nickname, level, avatar_url)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (cursor) {
        const decoded = decodeCursor(cursor)
        if (decoded) {
          query = query.lt('created_at', decoded.createdAt)
        }
      }

      const { data: reviews } = await query

      if (!reviews || reviews.length === 0) return { data: [], nextCursor: null }

      // Check helpful votes
      const reviewIds = reviews.map((r) => r.id)
      const { data: votes } = await supabase
        .from('helpful_votes')
        .select('review_id')
        .eq('user_id', userId)
        .in('review_id', reviewIds)

      const helpfulSet = new Set((votes ?? []).map((v) => v.review_id))

      type ReviewRow = {
        id: string
        overall_rating: number
        title: string
        content: string
        helpful_count: number
        created_at: string
        subject_id: string
        user_id: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public_profiles: any
      }

      const mapped: FeedReview[] = (reviews as ReviewRow[]).map((r) => {
        const profileRaw = r.public_profiles
        const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw
        return {
          id: r.id,
          user: {
            id: profile?.id ?? r.user_id,
            nickname: profile?.nickname ?? 'Unknown',
            level: (profile?.level ?? 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum',
            avatar_url: profile?.avatar_url ?? null,
          },
          subject_id: r.subject_id,
          overall_rating: r.overall_rating,
          title: r.title,
          content: r.content,
          helpful_count: r.helpful_count,
          created_at: r.created_at,
          is_helpful: helpfulSet.has(r.id),
        }
      })

      const last = reviews[reviews.length - 1]
      const nextCursor = reviews.length === PAGE_SIZE
        ? encodeCursor(last.created_at, last.id)
        : null

      return { data: mapped, nextCursor }
    },
    [userId]
  )

  const { items, loading, hasMore, loadMore } = useInfiniteScroll(fetchFeed)

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm max-w-xs">
          Follow reviewers to see their reviews here
        </p>
      </div>
    )
  }

  return (
    <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
      <div className="space-y-3">
        {items.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={userId}
          />
        ))}
      </div>
    </InfiniteScroll>
  )
}

export default function FeedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-400 text-sm">{tCommon('loading')}</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">{tNav('feed')}</h1>
      <FeedContent userId={user.id} />
    </div>
  )
}
