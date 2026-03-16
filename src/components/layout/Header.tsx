'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function Header() {
  const t = useTranslations('common')
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Detect current locale from path
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'
  const otherLocale = currentLocale === 'ko' ? 'en' : 'ko'

  function switchLocale() {
    // Replace locale prefix in pathname
    let newPath: string
    if (currentLocale === 'ko') {
      // pathname starts with /ko or no prefix (default ko)
      if (pathname.startsWith('/ko')) {
        newPath = '/en' + pathname.slice(3)
      } else {
        newPath = '/en' + pathname
      }
    } else {
      // pathname starts with /en
      newPath = '/ko' + pathname.slice(3)
    }
    router.push(newPath)
  }

  const nickname =
    user?.user_metadata?.nickname ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link
          href={`/${currentLocale}`}
          className="text-xl font-bold text-indigo-600 shrink-0"
        >
          {t('appName')}
        </Link>

        {/* Search input — hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md">
          <input
            type="text"
            placeholder={t('search')}
            className="w-full px-4 py-1.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-indigo-400 bg-gray-50"
            readOnly
          />
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Locale toggle */}
          <button
            onClick={switchLocale}
            className="text-xs font-medium px-2.5 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
            aria-label={`Switch to ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </button>

          {/* Auth */}
          {!loading && (
            <>
              {user ? (
                <Link
                  href={`/${currentLocale}/profile`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {user.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={nickname}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold flex items-center justify-center">
                      {nickname.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {nickname}
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/${currentLocale}/auth/login`}
                  className="text-sm font-medium px-4 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  {t('login')}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
