'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import SearchBar from '@/components/search/SearchBar'
import NotificationBell from '@/components/notification/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/button'
import ShimmerText from '@/components/ui/ShimmerText'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function Header() {
  const t = useTranslations('common')
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Detect current locale from path
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const nickname =
    user?.user_metadata?.nickname ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto flex items-center h-14 px-4 gap-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="shrink-0 text-lg font-bold text-primary"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Do! <ShimmerText>Ratings!</ShimmerText>
        </Link>

        {/* Search bar — hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto">
          <SearchBar className="w-full" />
        </div>

        {/* Mobile search icon */}
        <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground ml-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="gap-1">
                  <span>🌐</span>
                  <span>{locale === 'ko' ? '한국어' : 'English'}</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className={locale === 'ko' ? 'text-primary font-medium' : ''}
                onClick={() => router.push(pathname.replace(`/${locale}`, '/ko'))}
              >
                한국어
              </DropdownMenuItem>
              <DropdownMenuItem
                className={locale === 'en' ? 'text-primary font-medium' : ''}
                onClick={() => router.push(pathname.replace(`/${locale}`, '/en'))}
              >
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                  <Avatar size="sm">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={nickname}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {nickname}
                  </span>
                </Link>
              ) : (
                <Button size="sm" render={<Link href={`/${locale}/auth/login`} />}>
                  {t('login')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {/* Mobile expandable search bar */}
      {searchOpen && (
        <div className="px-4 py-2 border-t border-border md:hidden">
          <SearchBar className="w-full" />
        </div>
      )}
    </header>
  )
}
