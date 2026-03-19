import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import UserCard from '@/components/user/UserCard'
import FollowButton from '@/components/user/FollowButton'
import ReviewList from '@/components/review/ReviewList'
import AchievementList from '@/components/user/AchievementList'
import TrustBadge from '@/components/user/TrustBadge'

interface PageProps {
  params: Promise<{ locale: string; userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('nickname')
    .eq('id', userId)
    .single()

  if (!profile) return {}

  const nickname = profile.nickname

  return {
    title: `${nickname} — Ratings`,
    description: `${nickname}'s profile on Ratings`,
    openGraph: {
      title: `${nickname} — Ratings`,
      description: `${nickname} has written reviews on Ratings`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nickname} — Ratings`,
    },
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale, userId } = await params
  const supabase = await createClient()

  // Fetch public profile
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, nickname, avatar_url, level, review_count, trust_score')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  // Fetch follower/following counts
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ])

  // Check if current user follows this user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  let isFollowing = false
  if (currentUser && currentUser.id !== userId) {
    const { data: follow } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .single()
    isFollowing = !!follow
  }

  const userProfile = {
    id: profile.id,
    nickname: profile.nickname,
    avatar_url: profile.avatar_url ?? null,
    level: (profile.level ?? 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum',
    review_count: profile.review_count ?? 0,
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
  }

  const trustScore = profile.trust_score ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile card + follow button */}
      <div className="space-y-3">
        <UserCard profile={userProfile} />
        <div className="px-1">
          <TrustBadge score={trustScore} size="md" />
        </div>
        {currentUser && currentUser.id !== userId && (
          <div className="flex justify-center">
            <FollowButton targetUserId={userId} isFollowing={isFollowing} />
          </div>
        )}
      </div>

      {/* Achievements */}
      <section className="mb-6">
        <AchievementList userId={userId} locale={locale} />
      </section>

      {/* User's reviews */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">{locale === 'ko' ? '리뷰' : 'Reviews'}</h2>
        <ReviewList userId={userId} />
      </section>
    </div>
  )
}
