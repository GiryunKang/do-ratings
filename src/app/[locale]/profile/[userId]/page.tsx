import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UserCard from '@/components/user/UserCard'
import FollowButton from '@/components/user/FollowButton'
import ReviewList from '@/components/review/ReviewList'
import AchievementList from '@/components/user/AchievementList'
import TrustBadge from '@/components/user/TrustBadge'
import ReviewFingerprint from '@/components/home/ReviewFingerprint'

interface PageProps {
  params: Promise<{ locale: string; userId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile, error: profileMetaError } = await supabase
    .from('public_profiles')
    .select('nickname')
    .eq('id', userId)
    .single()
  if (profileMetaError) console.error('[ProfilePage] profile metadata query error:', profileMetaError.message)

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
  const { data: profile, error: profileError } = await supabase
    .from('public_profiles')
    .select('id, nickname, avatar_url, level, review_count, trust_score')
    .eq('id', userId)
    .single()
  if (profileError) console.error('[ProfilePage] profile query error:', profileError.message)

  if (!profile) notFound()

  // Fetch follower/following counts
  const [
    { count: followerCount, error: followerError },
    { count: followingCount, error: followingError },
  ] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ])
  const countErrors = [followerError, followingError].filter(Boolean)
  if (countErrors.length > 0) {
    console.error('[ProfilePage] follow count query errors:', countErrors.map(e => e!.message))
  }

  // Check if current user follows this user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  let isFollowing = false
  if (currentUser && currentUser.id !== userId) {
    const { data: follow, error: followError } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .single()
    if (followError && followError.code !== 'PGRST116') {
      console.error('[ProfilePage] follow check query error:', followError.message)
    }
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
  const isOwnProfile = currentUser?.id === userId

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

      {/* Mobile menu - only on own profile */}
      {isOwnProfile && (
        <div className="md:hidden bg-card rounded-xl shadow-sm ring-1 ring-foreground/[0.06] p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">{locale === 'ko' ? '내 메뉴' : 'My Menu'}</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: `/${locale}/dashboard`, icon: '📊', label: locale === 'ko' ? '대시보드' : 'Dashboard' },
              { href: `/${locale}/collections`, icon: '📚', label: locale === 'ko' ? '컬렉션' : 'Collections' },
              { href: `/${locale}/battles`, icon: '⚔️', label: locale === 'ko' ? '배틀' : 'Battles' },
              { href: `/${locale}/notifications`, icon: '🔔', label: locale === 'ko' ? '알림' : 'Notifications' },
              { href: `/${locale}/settings`, icon: '⚙️', label: locale === 'ko' ? '설정' : 'Settings' },
              { href: `/${locale}/about`, icon: '💡', label: locale === 'ko' ? '소개' : 'About' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
                <span className="text-lg">{item.icon}</span>
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Review Fingerprint — rating personality visualization */}
      <ReviewFingerprint locale={locale} />

      {/* Achievements */}
      <section className="mb-6">
        <AchievementList userId={userId} locale={locale} />
      </section>

      {/* User's reviews */}
      <section>
        <h2 className="text-base font-semibold text-foreground/80 mb-3">{locale === 'ko' ? '리뷰' : 'Reviews'}</h2>
        <ReviewList userId={userId} />
      </section>
    </div>
  )
}
