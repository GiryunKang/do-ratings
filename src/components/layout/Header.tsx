'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Globe, Menu, Search, X } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import SearchBar from '@/components/search/SearchBar'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'
  const ko = locale === 'ko'
  const { user, loading } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const iconButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground'
  return <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
    <div className="flex h-16 items-center gap-1 px-3 sm:gap-3 sm:px-6">
      <Link href={`/${locale}`} className="mr-auto shrink-0 font-display text-base tracking-tight sm:text-lg lg:w-48">DO<span className="text-primary">!</span> RATINGS<span className="text-primary">!</span></Link>
      <div className="mx-auto hidden w-full max-w-lg md:block"><SearchBar /></div>
      <button type="button" aria-label={ko ? '검색 열기' : 'Open search'} aria-expanded={searchOpen} aria-controls="header-search" onClick={() => { setSearchOpen(value => !value); setMenuOpen(false) }} className={`${iconButton} md:hidden`}>{searchOpen ? <X size={20} /> : <Search size={20} />}</button>
      {user && <Link href={`/${locale}/notifications`} aria-label={ko ? '알림' : 'Notifications'} className={`${iconButton} hidden lg:flex`}><Bell size={19} /></Link>}
      <div className="relative">
        <button type="button" aria-label={ko ? '메뉴 및 화면 설정' : 'Menu and display settings'} aria-expanded={menuOpen} aria-controls="header-menu" className={iconButton} onClick={() => { setMenuOpen(value => !value); setSearchOpen(false) }}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        {menuOpen && <><button type="button" tabIndex={-1} aria-label={ko ? '메뉴 닫기' : 'Close menu'} className="fixed inset-0 top-16 z-40 cursor-default" onClick={() => setMenuOpen(false)} /><div id="header-menu" className="absolute right-0 top-full z-50 mt-3 max-h-[75dvh] w-60 overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-lg" onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false) }}>
          <p className="px-2 py-2 text-xs font-semibold text-muted-foreground">{ko ? '화면 설정' : 'Display'}</p>
          <ThemeToggle />
          <button type="button" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted" onClick={() => { setMenuOpen(false); router.push(pathname.replace(/^\/(ko|en)(?=\/|$)/, ko ? '/en' : '/ko') + window.location.search) }}><Globe size={17} />{ko ? 'English로 보기' : '한국어로 보기'}</button>
          <nav aria-label={ko ? '더 보기' : 'More destinations'} className="mt-2 border-t border-border pt-2">{[['explore', '둘러보기', 'Explore'], ['play', '취향 탐험', 'Taste quest'], ['rankings', '랭킹', 'Rankings'], ['discover', '발견', 'Discover'], ['highlights', '하이라이트', 'Highlights'], ['battles', '배틀', 'Battles'], ['dashboard', '대시보드', 'Dashboard'], ['notifications', '알림', 'Notifications']].map(([route, kr, en]) => <Link key={route} href={`/${locale}/${route}`} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-muted">{ko ? kr : en}</Link>)}</nav>
        </div></>}
      </div>
      {!loading && <Link href={user ? `/${locale}/profile` : `/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`} aria-label={user ? ko ? '내 프로필' : 'My profile' : undefined} className="flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold sm:text-sm">{user ? ko ? '내 정보' : 'Profile' : ko ? '로그인' : 'Log in'}</Link>}
    </div>
    {searchOpen && <div id="header-search" className="border-t border-border px-4 py-3 md:hidden"><SearchBar /></div>}
  </header>
}
