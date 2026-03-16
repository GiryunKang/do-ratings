'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const tabs = [
  {
    key: 'home',
    href: '',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
      </svg>
    ),
  },
  {
    key: 'rankings',
    href: '/rankings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'explore',
    href: '/explore',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>
    ),
  },
  {
    key: 'feed',
    href: '/feed',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 4v6h6M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    key: 'profile',
    href: '/profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  // Detect locale prefix
  const localeMatch = pathname.match(/^\/(ko|en)/)
  const locale = localeMatch ? localeMatch[1] : 'ko'
  const basePath = `/${locale}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-100 md:hidden">
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const href = basePath + tab.href
          const isActive =
            tab.href === ''
              ? pathname === basePath || pathname === basePath + '/'
              : pathname.startsWith(basePath + tab.href)

          return (
            <Link
              key={tab.key}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={isActive ? 'transform scale-110 transition-transform duration-200' : ''}>
                {tab.icon}
              </span>
              <span>{t(tab.key as 'home' | 'explore' | 'rankings' | 'feed' | 'profile')}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-scaleIn" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
