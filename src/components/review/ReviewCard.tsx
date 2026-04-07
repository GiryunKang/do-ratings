'use client'

import Link from 'next/link'
import StarRating from './StarRating'
import UserBadge from '@/components/user/UserBadge'
import HelpfulButton from './HelpfulButton'
import NotHelpfulButton from './NotHelpfulButton'
import ImageGallery from './ImageGallery'
import ReactionBar from './ReactionBar'
import CommentSection from './CommentSection'
import TrustBadge from '@/components/user/TrustBadge'
import ReportButton from './ReportButton'
import { timeAgo } from '@/lib/utils/timeAgo'
import { countryCodeToFlag, getCountryName } from '@/lib/utils/country'
import { getCategoryColor } from '@/lib/utils/category-colors'
import ShareMenu from '@/components/ui/ShareMenu'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
    not_helpful_count?: number
    created_at: string
    is_helpful?: boolean
    is_not_helpful?: boolean
    images?: { id: string; url: string }[]
    trust_score?: number
    reactions?: Record<string, number>
    user_reaction?: string | null
    comment_count?: number
    country_code?: string | null
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
    : 'bg-primary'

  return (
    <Card className="hover:shadow-md transition-shadow animate-fadeIn">
      <CardContent className="pt-4 pb-3 px-4">
        {/* User info row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
              {user.nickname.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {hasCategoryInfo && (
            <>
              <Badge
                variant="secondary"
                className={`text-white text-[10px] px-1.5 py-0 h-4 ${categoryColor} border-0`}
              >
                {categoryLabel}
              </Badge>
              <span className="text-muted-foreground/60">•</span>
            </>
          )}

          <Link
            href={`/profile/${user.id}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            {user.nickname}
          </Link>

          {review.country_code && (
            <span
              title={getCountryName(review.country_code, locale)}
              className="text-base leading-none"
            >
              {countryCodeToFlag(review.country_code)}
            </span>
          )}

          <UserBadge level={user.level} />

          {review.trust_score != null && review.trust_score > 0 && (
            <TrustBadge score={review.trust_score} size="sm" />
          )}

          <span className="text-muted-foreground/60">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo(review.created_at)}</span>
        </div>

        {/* Title */}
        <Link href={subjectHref} className="block group mt-2">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {review.title}
          </h3>
        </Link>

        {/* Content */}
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{review.content}</p>

        {/* Image Gallery */}
        {review.images && review.images.length > 0 && (
          <div className="mt-2">
            <ImageGallery images={review.images} />
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <StarRating value={review.overall_rating} readonly size="sm" />
          <span className="text-sm text-muted-foreground font-medium tabular-nums">
            {review.overall_rating.toFixed(1)}
          </span>
        </div>

        <Separator className="my-3" />

        {/* Engagement bar */}
        <div className="flex items-center gap-1">
          <HelpfulButton
            reviewId={review.id}
            initialCount={review.helpful_count}
            isHelpful={review.is_helpful ?? false}
            reviewUserId={user.id}
            currentUserId={currentUserId ?? null}
          />
          <NotHelpfulButton
            reviewId={review.id}
            initialCount={review.not_helpful_count ?? 0}
            isNotHelpful={review.is_not_helpful ?? false}
            reviewUserId={user.id}
            currentUserId={currentUserId ?? null}
          />
          <ReactionBar
            reviewId={review.id}
            currentUserId={currentUserId ?? null}
            initialReactions={review.reactions ?? {}}
            userReaction={review.user_reaction ?? null}
          />
          <ShareMenu
            url={subjectHref}
            title={review.title}
            type="review"
            locale={locale}
          />

          {/* Report */}
          {currentUserId && currentUserId !== review.user.id && (
            <div className="ml-auto">
              <ReportButton reviewId={review.id} />
            </div>
          )}
        </div>

        {/* Comment Section */}
        <CommentSection
          reviewId={review.id}
          currentUserId={currentUserId ?? null}
          locale={locale}
        />
      </CardContent>
    </Card>
  )
}
