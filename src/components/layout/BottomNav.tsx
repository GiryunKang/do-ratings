'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Compass, Flag, Home, UserRound } from 'lucide-react'
export default function BottomNav() {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'
  const ko = locale === 'ko'
  const items = [
    { path: '', label: ko ? '홈' : 'Home', icon: Home },
    { path: '/explore', label: ko ? '둘러보기' : 'Explore', icon: Compass },
    { path: '/play', label: ko ? '탐험' : 'Quest', icon: Flag },
    { path: '/collections', label: ko ? '저장됨' : 'Saved', icon: Bookmark },
    { path: '/profile', label: ko ? '내 정보' : 'Profile', icon: UserRound },
  ]
  return <nav aria-label={ko ? '주요 메뉴' : 'Main navigation'} className="mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card lg:hidden">{items.map(item => {
    const active = item.path ? pathname.startsWith(`/${locale}${item.path}`) : pathname === `/${locale}`
    return <Link key={item.path} href={`/${locale}${item.path}`} aria-current={active ? 'page' : undefined} className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] ${active ? 'font-semibold text-secondary' : 'text-muted-foreground hover:text-foreground'}`}><item.icon size={20} strokeWidth={active ? 2.5 : 1.75} aria-hidden="true" /><span>{item.label}</span></Link>
  })}</nav>
}
