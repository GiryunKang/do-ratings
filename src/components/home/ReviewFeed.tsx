'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { useAuth } from '@/lib/hooks/useAuth'
import InfiniteScroll from '@/components/ui/InfiniteScroll'
import ReviewCard from '@/components/review/ReviewCard'
import SortControls from './SortControls'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { CategoryIcon } from '@/lib/icons'

interface ReviewFeedProps {
  categories: Array<{ id: string; slug: string; name: Record<string, string>; icon: string }>
  locale: string
  subjects?: Array<{
    id: string
    name: Record<string, string>
    description?: Record<string, string>
    avg_rating: number | null
    review_count: number
    category_slug: string
    category_name: Record<string, string>
    category_icon: string
  }>
}

export default function ReviewFeed({ categories, locale, subjects }: ReviewFeedProps) {
  const { user } = useAuth()
  const [sort, setSort] = useState('latest')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetchReviews = useCallback(
    async (cursor: string | null) => {
      const supabase = createClient()

      let query = supabase
        .from('reviews')
        .select(
          `id, overall_rating, title, content, helpful_count, created_at, subject_id, user_id,
           public_profiles(id, nickname, level, avatar_url),
           subjects(id, name, category_id, categories(slug, name, icon))`
        )
        .limit(10)

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = categories.find((c) => c.slug === categoryFilter)
        if (cat) {
          query = query.eq('subjects.category_id', cat.id)
        }
      }

      // Cursor-based pagination (only for latest sort)
      if (cursor) {
        try {
          const { createdAt } = JSON.parse(atob(cursor))
          if (sort === 'latest') query = query.lt('created_at', createdAt)
        } catch {
          // ignore bad cursor
        }
      }

      // Sort
      if (sort === 'latest') {
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'popular') {
        query = query.order('helpful_count', { ascending: false })
      } else if (sort === 'topRated') {
        query = query.order('overall_rating', { ascending: false })
      }

      const { data } = await query
      if (!data || data.length === 0) return { data: [], nextCursor: null }

      // Check helpful votes for current user
      let helpfulSet = new Set<string>()
      if (user) {
        const { data: votes } = await supabase
          .from('helpful_votes')
          .select('review_id')
          .eq('user_id', user.id)
          .in(
            'review_id',
            data.map((r) => r.id)
          )
        if (votes) helpfulSet = new Set(votes.map((v) => v.review_id))
      }

      const mapped = data.map((r) => {
        const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
        const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
        const category = subject?.categories
        const catData = Array.isArray(category) ? category[0] : category

        return {
          id: r.id,
          user: {
            id: (profile as { id?: string } | null)?.id ?? r.user_id,
            nickname: (profile as { nickname?: string } | null)?.nickname ?? 'Unknown',
            level: ((profile as { level?: string } | null)?.level ?? 'bronze') as
              | 'bronze'
              | 'silver'
              | 'gold'
              | 'platinum',
            avatar_url: (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null,
          },
          subject_id: r.subject_id,
          overall_rating: r.overall_rating,
          title: r.title,
          content: r.content,
          helpful_count: r.helpful_count,
          created_at: r.created_at,
          is_helpful: helpfulSet.has(r.id),
          // Extra fields for future Chunk 3 ReviewCard update
          subject_name: (subject as { name?: Record<string, string> } | null)?.name ?? {},
          category_slug: (catData as { slug?: string } | null)?.slug ?? '',
          category_name: (catData as { name?: Record<string, string> } | null)?.name ?? {},
          category_icon: (catData as { icon?: string } | null)?.icon ?? 'folder',
        }
      })

      const last = data[data.length - 1]
      const nextCursor =
        data.length === 10
          ? btoa(JSON.stringify({ createdAt: last.created_at, id: last.id }))
          : null

      return { data: mapped, nextCursor }
    },
    [sort, categoryFilter, user, categories]
  )

  const { items, loading, hasMore, loadMore, reset } = useInfiniteScroll(fetchReviews)

  function handleSortChange(newSort: string) {
    setSort(newSort)
    reset()
  }

  function handleCategoryChange(newCat: string) {
    setCategoryFilter(newCat)
    reset()
  }

  return (
    <div>
      <SortControls
        sort={sort}
        category={categoryFilter}
        categories={categories}
        locale={locale}
        onSortChange={handleSortChange}
        onCategoryChange={handleCategoryChange}
      />

      {items.length === 0 && loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="skeleton w-6 h-6 rounded-full" />
                <div className="skeleton w-32 h-3" />
              </div>
              <div className="skeleton w-3/4 h-5" />
              <div className="skeleton w-full h-12" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">
            {locale === 'ko' ? '평가할 대상을 찾아보세요' : 'Find something to review'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects?.map(subject => {
              const name = subject.name[locale] ?? subject.name['ko']
              const desc = subject.description?.[locale] ?? subject.description?.['ko'] ?? ''
              const catName = subject.category_name[locale] ?? subject.category_name['ko']
              return (
                <Link key={subject.id} href={`/${locale}/subject/${subject.id}`}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-full ${getCategoryColor(subject.category_slug)} flex items-center justify-center`}>
                      <CategoryIcon name={subject.category_icon} className="w-3.5 h-3.5 text-white" />
                    </span>
                    <span className="text-xs text-muted-foreground">{catName}</span>
                  </div>
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h4>
                  {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{desc}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {subject.avg_rating ? (
                      <span className="text-yellow-500">★ {subject.avg_rating.toFixed(1)}</span>
                    ) : (
                      <span>{locale === 'ko' ? '아직 평점 없음' : 'No ratings yet'}</span>
                    )}
                    <span>•</span>
                    <span>{subject.review_count} {locale === 'ko' ? '리뷰' : 'reviews'}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
          <div className="space-y-3">
            {items.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={user?.id ?? null}
                locale={locale}
              />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  )
}
