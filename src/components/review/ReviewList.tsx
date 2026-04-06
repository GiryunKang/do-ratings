'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star } from 'lucide-react'

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
}

interface ReviewRow {
  id: string
  overall_rating: number
  title: string
  content: string
  helpful_count: number
  not_helpful_count: number
  created_at: string
  subject_id: string
  user_id: string
  country_code: string | null
  public_profiles: { id: string; nickname: string; avatar_url: string | null; level: string } | { id: string; nickname: string; avatar_url: string | null; level: string }[] | null
  helpful_votes?: { user_id: string }[]
}

const PAGE_SIZE = 10

export default function ReviewList({ subjectId, userId }: ReviewListProps) {
  const { user: currentUser } = useAuth()
  const pathname = usePathname()
  const locale = pathname?.startsWith('/en') ? 'en' : 'ko'
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
          not_helpful_count,
          created_at,
          subject_id,
          user_id,
          country_code,
          public_profiles!reviews_user_id_fkey(id, nickname, level, avatar_url)
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

      // Check helpful / not_helpful votes for current user
      let helpfulSet = new Set<string>()
      let notHelpfulSet = new Set<string>()
      if (currentUser) {
        const reviewIds = data.map((r) => r.id)
        const [{ data: helpfulVotes }, { data: notHelpfulVotes }] = await Promise.all([
          supabase
            .from('helpful_votes')
            .select('review_id')
            .eq('user_id', currentUser.id)
            .in('review_id', reviewIds),
          supabase
            .from('not_helpful_votes')
            .select('review_id')
            .eq('user_id', currentUser.id)
            .in('review_id', reviewIds),
        ])
        if (helpfulVotes) helpfulSet = new Set(helpfulVotes.map((v) => v.review_id))
        if (notHelpfulVotes) notHelpfulSet = new Set(notHelpfulVotes.map((v) => v.review_id))
      }

      const mapped = (data as ReviewRow[]).map((r) => {
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
          not_helpful_count: r.not_helpful_count,
          created_at: r.created_at,
          is_helpful: helpfulSet.has(r.id),
          is_not_helpful: notHelpfulSet.has(r.id),
          country_code: r.country_code ?? null,
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

  const { items, loading, hasMore, loadMore, reset } = useInfiniteScroll(fetchReviews)

  function handleSortChange(newSort: string) {
    setSort(newSort)
    reset()
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <SortSelect value={sort} onChange={handleSortChange} />
      </div>

      {items.length === 0 && loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="skeleton w-24 h-4" />
              </div>
              <div className="skeleton w-3/4 h-5" />
              <div className="skeleton w-full h-16" />
            </div>
          ))}
        </div>
      ) : items.length === 0 && !loading ? (
        <div className="text-center py-10">
          <div className="flex justify-center mb-3">
            <Star className="w-10 h-10 text-primary fill-primary/30" />
          </div>
          <p className="text-foreground font-bold text-base mb-1">
            {locale === 'ko' ? '아직 아무도 평가하지 않았습니다' : 'No one has rated this yet'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {locale === 'ko' ? '당신의 의견이 기준이 됩니다. 첫 번째 리뷰어가 되어보세요.' : 'Your opinion sets the standard. Be the first reviewer.'}
          </p>
          {subjectId && (
            <Link
              href={`/${locale}/write/${subjectId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background font-semibold rounded-full shadow-md hover:shadow-lg hover:opacity-90 transition-opacity text-sm"
            >
              <span>★</span>
              {locale === 'ko' ? '리뷰 작성하기' : 'Write a Review'}
            </Link>
          )}
        </div>
      ) : (
        <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
          <div className="space-y-3">
            {items.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <ReviewCard
                  review={review}
                  currentUserId={currentUser?.id ?? null}
                />
              </motion.div>
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  )
}
