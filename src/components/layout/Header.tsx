'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Globe } from 'lucide-react'

import { useAuth } from '@/lib/hooks/useAuth'
import SearchBar from '@/components/search/SearchBar'
import NotificationBell from '@/components/notification/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/button'
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

  // Detect current locale from path
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const nickname =
    user?.user_metadata?.nickname ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center h-14 px-4 gap-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="shrink-0 text-lg font-display tracking-tight underline decoration-2 underline-offset-4"
        >
          <span className="text-foreground">DO</span>
          <span className="text-primary">!</span>
          <span className="text-foreground"> RATINGS</span>
          <span className="text-primary">!</span>
        </Link>

        {/* Search bar — hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto">
          <SearchBar className="w-full" />
        </div>

        {/* Mobile search icon */}
        <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 ml-auto">
          <Search className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-secondary">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-semibold tracking-wide">LIVE</span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Theme toggle — hidden on small mobile */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Language dropdown — hidden on small mobile */}
          <div className="hidden sm:block">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="w-4 h-4" />
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
                <Button size="sm" className="rounded-full bg-primary text-white hover:bg-primary/90" render={<Link href={`/${locale}/auth/login`} />}>
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
