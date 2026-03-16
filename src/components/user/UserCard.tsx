import { useTranslations } from 'next-intl'
import UserBadge from '@/components/user/UserBadge'

interface UserProfile {
  id: string
  nickname: string
  avatar_url: string | null
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  review_count: number
  follower_count: number
  following_count: number
}

interface UserCardProps {
  profile: UserProfile
}

export default function UserCard({ profile }: UserCardProps) {
  const t = useTranslations('user')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.nickname}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <span className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 text-2xl font-bold flex items-center justify-center">
              {profile.nickname.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{profile.nickname}</h1>
            <UserBadge level={profile.level} />
            {profile.level === 'platinum' && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {t('topReviewer')}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">{profile.review_count}</p>
              <p className="text-xs text-gray-500">{t('reviews')}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">{profile.follower_count}</p>
              <p className="text-xs text-gray-500">{t('followers')}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">{profile.following_count}</p>
              <p className="text-xs text-gray-500">{t('following')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
