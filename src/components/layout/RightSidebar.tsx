import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'
import UserBadge from '@/components/user/UserBadge'

interface RightSidebarProps {
  locale: string
}

export default async function RightSidebar({ locale }: RightSidebarProps) {
  const supabase = await createClient()

  const categoryOrder = ['people', 'places', 'companies', 'restaurants', 'airlines', 'hotels']

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('*')

  const { data: reviewersRaw } = await supabase
    .from('public_profiles')
    .select('*')
    .order('review_count', { ascending: false })
    .limit(5)

  const categories = (categoriesRaw ?? []).sort((a, b) => {
    const ai = categoryOrder.indexOf(a.slug as string)
    const bi = categoryOrder.indexOf(b.slug as string)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  const reviewers = reviewersRaw ?? []

  return (
    <aside className="hidden lg:block fixed right-0 top-16 w-72 h-[calc(100vh-64px)] overflow-y-auto border-l border-gray-200 bg-background z-40">
      <div className="p-4 space-y-6">
        {/* 인기 카테고리 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            인기 카테고리
          </h3>
          <ul className="space-y-2">
            {categories.map((cat) => {
              const catName = (cat.name as Record<string, string>)
              const displayName = catName[locale] ?? catName['ko'] ?? cat.slug
              return (
                <li key={cat.id} className="flex items-center gap-3 py-1.5">
                  <span
                    className={`w-8 h-8 rounded-full ${getCategoryColor(cat.slug)} flex items-center justify-center shrink-0`}
                  >
                    <CategoryIcon name={cat.icon ?? 'folder'} className="w-4 h-4 text-white" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  </div>
                  <Link
                    href={`/${locale}/category/${cat.slug}`}
                    className="text-xs font-medium text-indigo-600 border border-indigo-200 rounded-full px-3 py-1 hover:bg-indigo-50 transition-colors shrink-0"
                  >
                    탐색
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* 인기 리뷰어 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            인기 리뷰어
          </h3>
          <ul className="space-y-2">
            {reviewers.map((reviewer) => {
              const nickname: string = reviewer.nickname ?? 'Unknown'
              const level = (reviewer.level ?? 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum'
              const reviewCount: number = reviewer.review_count ?? 0
              const avatarUrl: string | null = reviewer.avatar_url ?? null

              return (
                <li key={reviewer.id} className="flex items-center gap-3 py-1.5">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={nickname}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold flex items-center justify-center shrink-0">
                      {nickname.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">{nickname}</span>
                      <UserBadge level={level} />
                    </div>
                    <p className="text-xs text-gray-400">{reviewCount} reviews</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </aside>
  )
}
