'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { useAuth } from '@/lib/hooks/useAuth'
import { encodeCursor, decodeCursor } from '@/lib/utils/cursor'
import InfiniteScroll from '@/components/ui/InfiniteScroll'
import ReviewCard from '@/components/review/ReviewCard'
import SortSelect from '@/components/search/SortSelect'

interface ReviewListProps {
  subjectId?: string
  userId?: string
  locale: string
}

interface ReviewRow {
  id: string
  overall_rating: number
  title: string
  content: string
  helpful_count: number
  created_at: string
  subject_id: string
  user_id: string
  public_profiles: {
    id: string
    nickname: string
    level: string
    avatar_url: string | null
  } | null
  helpful_votes?: { user_id: string }[]
}

const PAGE_SIZE = 10

export default function ReviewList({ subjectId, userId, locale }: ReviewListProps) {
  const { user: currentUser } = useAuth()
  const [sort, setSort] = useState('latest')

  const fetchReviews = useCallback(
    async (cursor: string | null) => {
      const supabase = createClient()

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
        .limit(PAGE_SIZE)

      if (subjectId) query = query.eq('subject_id', subjectId)
      if (userId) query = query.eq('user_id', userId)

      if (cursor) {
        const decoded = decodeCursor(cursor)
        if (decoded) {
          if (sort === 'latest') {
            query = query.lt('created_at', decoded.createdAt)
          } else if (sort === 'helpful') {
            query = query.lt('helpful_count', parseInt(decoded.id))
          } else if (sort === 'rating') {
            query = query.lt('overall_rating', parseFloat(decoded.createdAt))
          }
        }
      }

      if (sort === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'helpful') {
        query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false })
      } else if (sort === 'rating') {
        query = query.order('overall_rating', { ascending: false }).order('created_at', { ascending: false })
      }

      const { data } = await query

      if (!data || data.length === 0) return { data: [], nextCursor: null }

      // Check helpful votes for current user
      let helpfulSet = new Set<string>()
      if (currentUser) {
        const reviewIds = data.map((r) => r.id)
        const { data: votes } = await supabase
          .from('helpful_votes')
          .select('review_id')
          .eq('user_id', currentUser.id)
          .in('review_id', reviewIds)
        if (votes) helpfulSet = new Set(votes.map((v) => v.review_id))
      }

      const mapped = data.map((r: ReviewRow) => {
        const profile = r.public_profiles
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

      const last = data[data.length - 1]
      let nextCursor: string | null = null
      if (data.length === PAGE_SIZE) {
        if (sort === 'latest') {
          nextCursor = encodeCursor(last.created_at, last.id)
        } else if (sort === 'helpful') {
          nextCursor = encodeCursor(last.created_at, String(last.helpful_count))
        } else if (sort === 'rating') {
          nextCursor = encodeCursor(String(last.overall_rating), last.id)
        }
      }

      return { data: mapped, nextCursor }
    },
    [subjectId, userId, sort, currentUser]
  )

  const { items, loading, hasMore, loadMore } = useInfiniteScroll(fetchReviews)

  function handleSortChange(newSort: string) {
    setSort(newSort)
    // Reset will happen via new fetchReviews memoization key change
    window.location.reload()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <SortSelect value={sort} onChange={handleSortChange} />
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-center text-gray-400 py-12 text-sm">No reviews yet</p>
      ) : (
        <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
          <div className="space-y-3">
            {items.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={currentUser?.id ?? null}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  )
}
