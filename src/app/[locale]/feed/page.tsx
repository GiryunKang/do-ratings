// TODO: extract metadata to server component wrapper
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { encodeCursor, decodeCursor } from '@/lib/utils/cursor'
import InfiniteScroll from '@/components/ui/InfiniteScroll'
import ReviewCard from '@/components/review/ReviewCard'

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

interface TopReviewer {
  id: string
  nickname: string
  review_count: number
  level: string
  avatar_url: string | null
}

const PAGE_SIZE = 10

function FeedSkeletonCards() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-32 rounded-xl" />
      ))}
    </div>
  )
}

function FeedContent({ userId, locale }: { userId: string; locale: string }) {
  const [topReviewers, setTopReviewers] = useState<TopReviewer[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set())

  const fetchFeed = useCallback(
    async (cursor: string | null) => {
      const supabase = createClient()

      // Get following IDs
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
      if (followsError) console.error('[FeedPage] follows query error:', followsError.message)

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
          public_profiles!reviews_user_id_fkey(id, nickname, level, avatar_url)
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

      const { data: reviews, error: reviewsError } = await query
      if (reviewsError) console.error('[FeedPage] reviews query error:', reviewsError.message)

      if (!reviews || reviews.length === 0) return { data: [], nextCursor: null }

      // Check helpful votes
      const reviewIds = reviews.map((r) => r.id)
      const { data: votes, error: votesError } = await supabase
        .from('helpful_votes')
        .select('review_id')
        .eq('user_id', userId)
        .in('review_id', reviewIds)
      if (votesError) console.error('[FeedPage] helpful_votes query error:', votesError.message)

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
        public_profiles: { id: string; nickname: string; avatar_url: string | null; level: string } | { id: string; nickname: string; avatar_url: string | null; level: string }[] | null
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

  useEffect(() => {
    if (loading || items.length > 0) return
    async function loadTopReviewers() {
      const supabase = createClient()
      const [
        { data: reviewers, error: reviewersError },
        { data: follows, error: followsError },
      ] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('id, nickname, review_count, level, avatar_url')
          .order('review_count', { ascending: false })
          .limit(3),
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId),
      ])
      const queryErrors = [reviewersError, followsError].filter(Boolean)
      if (queryErrors.length > 0) {
        console.error('[FeedPage] top reviewers query errors:', queryErrors.map(e => e!.message))
      }
      if (reviewers) setTopReviewers(reviewers as TopReviewer[])
      if (follows) setFollowingIds(new Set(follows.map((f) => f.following_id)))
    }
    loadTopReviewers()
  }, [loading, items.length, userId])

  async function handleFollow(targetId: string) {
    setFollowLoading((prev) => new Set(prev).add(targetId))
    try {
      const supabase = createClient()
      if (followingIds.has(targetId)) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', targetId)
        if (error) console.error('[FeedPage] unfollow error:', error.message)
        setFollowingIds((prev) => { const next = new Set(prev); next.delete(targetId); return next })
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: targetId })
        if (error) console.error('[FeedPage] follow error:', error.message)
        setFollowingIds((prev) => new Set(prev).add(targetId))
      }
    } finally {
      setFollowLoading((prev) => { const next = new Set(prev); next.delete(targetId); return next })
    }
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-muted-foreground font-medium text-sm mb-1">
            {locale === 'ko' ? '피드가 비어 있습니다' : 'Your feed is empty'}
          </p>
          <p className="text-muted-foreground text-sm max-w-xs">
            {locale === 'ko' ? '리뷰어를 팔로우하면 여기에 리뷰가 표시됩니다' : 'Follow reviewers to see their reviews here'}
          </p>
        </div>

        {topReviewers.length > 0 && (
          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {locale === 'ko' ? '추천 리뷰어' : 'Recommended Reviewers'}
            </p>
            <div className="space-y-3">
              {topReviewers.map((reviewer) => (
                <div key={reviewer.id} className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3">
                  <Link href={`/${locale}/user/${reviewer.id}`} className="shrink-0">
                    {reviewer.avatar_url ? (
                      <img src={reviewer.avatar_url} alt={reviewer.nickname} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {reviewer.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0 text-left">
                    <Link href={`/${locale}/user/${reviewer.id}`}>
                      <p className="text-sm font-semibold text-foreground truncate">{reviewer.nickname}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ko' ? `리뷰 ${reviewer.review_count}개` : `${reviewer.review_count} reviews`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(reviewer.id)}
                    disabled={followLoading.has(reviewer.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      followingIds.has(reviewer.id)
                        ? 'bg-muted text-muted-foreground hover:bg-muted'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {followLoading.has(reviewer.id)
                      ? '...'
                      : followingIds.has(reviewer.id)
                        ? (locale === 'ko' ? '팔로잉' : 'Following')
                        : (locale === 'ko' ? '팔로우' : 'Follow')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href={`/${locale}/rankings`}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:shadow-lg transition-all"
        >
          {locale === 'ko' ? '더 많은 리뷰어 탐색' : 'Discover More Reviewers'}
        </Link>
      </div>
    )
  }

  if (loading && items.length === 0) {
    return <FeedSkeletonCards />
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
  const pathname = usePathname()
  const tNav = useTranslations('nav')

  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth/login`)
    }
  }, [locale, user, loading, router])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-5">{tNav('feed')}</h1>
        <FeedSkeletonCards />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-5">{tNav('feed')}</h1>
      <FeedContent userId={user.id} locale={locale} />
    </div>
  )
}
