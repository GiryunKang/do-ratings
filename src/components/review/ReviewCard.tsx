import Link from 'next/link'
import StarRating from './StarRating'
import UserBadge from '@/components/user/UserBadge'
import HelpfulButton from './HelpfulButton'
import { timeAgo } from '@/lib/utils/timeAgo'

interface ReviewUser {
  id: string
  nickname: string
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  avatar_url: string | null
}

interface ReviewCardProps {
  review: {
    id: string
    user: ReviewUser
    subject_id: string
    subject_slug?: string
    overall_rating: number
    title: string
    content: string
    helpful_count: number
    created_at: string
    is_helpful?: boolean
  }
  currentUserId?: string | null
}

export default function ReviewCard({ review, currentUserId }: ReviewCardProps) {
  const { user } = review
  const subjectHref = review.subject_slug
    ? `/subject/${review.subject_slug}`
    : `/subject/${review.subject_id}`

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* User info */}
      <div className="flex items-center gap-2 mb-3">
        <Link href={`/profile/${user.id}`} className="shrink-0">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.nickname}
              className="w-9 h-9 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <span className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold flex items-center justify-center">
              {user.nickname.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/profile/${user.id}`}
              className="text-sm font-semibold text-gray-800 hover:underline truncate"
            >
              {user.nickname}
            </Link>
            <UserBadge level={user.level} />
          </div>
          <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
        </div>
        <div className="ml-auto shrink-0">
          <StarRating value={review.overall_rating} readonly size="sm" />
        </div>
      </div>

      {/* Title & Content */}
      <Link href={subjectHref} className="block group">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
          {review.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-3">{review.content}</p>
      </Link>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3">
        <HelpfulButton
          reviewId={review.id}
          initialCount={review.helpful_count}
          isHelpful={review.is_helpful ?? false}
          reviewUserId={user.id}
          currentUserId={currentUserId ?? null}
        />
      </div>
    </article>
  )
}
