import Link from 'next/link'
import StarRating from './StarRating'
import UserBadge from '@/components/user/UserBadge'
import HelpfulButton from './HelpfulButton'
import { timeAgo } from '@/lib/utils/timeAgo'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface ReviewCardProps {
  review: {
    id: string
    user: {
      id: string
      nickname: string
      level: 'bronze' | 'silver' | 'gold' | 'platinum'
      avatar_url: string | null
    }
    subject_id: string
    subject_slug?: string
    subject_name?: Record<string, string>
    category_slug?: string
    category_name?: Record<string, string>
    category_icon?: string
    overall_rating: number
    title: string
    content: string
    helpful_count: number
    created_at: string
    is_helpful?: boolean
  }
  currentUserId?: string | null
  locale?: string
}

export default function ReviewCard({ review, currentUserId, locale = 'ko' }: ReviewCardProps) {
  const { user } = review
  const subjectHref = review.subject_slug
    ? `/subject/${review.subject_slug}`
    : `/subject/${review.subject_id}`

  const hasCategoryInfo = !!review.category_slug

  const categoryLabel =
    review.category_name?.[locale] ??
    review.category_name?.['ko'] ??
    review.category_slug ??
    ''

  const categoryColor = review.category_slug
    ? getCategoryColor(review.category_slug)
    : 'bg-indigo-500'

  return (
    <article className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-4 transition-colors animate-fadeIn">
      {/* Top meta line */}
      <div className="flex items-center gap-1.5 flex-wrap text-sm text-gray-500">
        {hasCategoryInfo && (
          <>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${categoryColor}`} />
            <span className="font-medium text-gray-700">r/{categoryLabel}</span>
            <span className="text-gray-400">•</span>
          </>
        )}
        <Link
          href={`/profile/${user.id}`}
          className="font-medium text-gray-700 hover:underline"
        >
          {user.nickname}
        </Link>
        <UserBadge level={user.level} />
        <span className="text-gray-400">•</span>
        <span className="text-gray-400 text-xs">{timeAgo(review.created_at)}</span>
      </div>

      {/* Title */}
      <Link href={subjectHref} className="block group mt-2">
        <h3 className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
          {review.title}
        </h3>
      </Link>

      {/* Content */}
      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{review.content}</p>

      {/* Rating */}
      <div className="flex items-center gap-2 mt-3">
        <StarRating value={review.overall_rating} readonly size="sm" />
        <span className="text-sm text-gray-600 font-medium">{review.overall_rating.toFixed(1)}</span>
      </div>

      {/* Engagement bar */}
      <div className="mt-3 flex items-center gap-3">
        <HelpfulButton
          reviewId={review.id}
          initialCount={review.helpful_count}
          isHelpful={review.is_helpful ?? false}
          reviewUserId={user.id}
          currentUserId={currentUserId ?? null}
        />
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          공유
        </button>
      </div>
    </article>
  )
}
