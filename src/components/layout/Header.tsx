'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import SearchBar from '@/components/search/SearchBar'
import NotificationBell from '@/components/notification/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Header() {
  const t = useTranslations('common')
  const { user, loading } = useAuth()
  const pathname = usePathname()

  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Detect current locale from path
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'
  const currentPath = pathname

  const nickname =
    user?.user_metadata?.nickname ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="shrink-0"
        >
          <span className="text-xl font-bold text-gradient">Ratings</span>
        </Link>

        {/* Search bar — hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto">
          <SearchBar className="w-full" />
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language dropdown */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>🌐</span>
              <span>{locale === 'ko' ? '한국어' : 'English'}</span>
              <svg className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  href={currentPath.replace(`/${locale}`, '/ko')}
                  className={`block px-4 py-2 text-sm hover:bg-gray-50 ${locale === 'ko' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                  onClick={() => setLangOpen(false)}
                >
                  한국어
                </Link>
                <Link
                  href={currentPath.replace(`/${locale}`, '/en')}
                  className={`block px-4 py-2 text-sm hover:bg-gray-50 ${locale === 'en' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                  onClick={() => setLangOpen(false)}
                >
                  English
                </Link>
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationBell userId={user?.id ?? null} />

          {/* Auth */}
          {!loading && (
            <>
              {user ? (
                <Link
                  href={`/${locale}/profile`}
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
                  href={`/${locale}/auth/login`}
                  className="text-sm font-medium px-4 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  {t('login')}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary opacity-30" />
    </header>
  )
}
