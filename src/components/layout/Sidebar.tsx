'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryIcon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/hooks/useAuth'
import CategoryRequestModal from '@/components/category/CategoryRequestModal'

interface Category {
  id: string
  name: Record<string, string>
  slug: string
  icon: string | null
}

export default function Sidebar({ locale }: { locale: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [categoryRequestOpen, setCategoryRequestOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const supabase = createClient()
    const categoryOrder = ['people', 'places', 'companies', 'restaurants', 'airlines', 'hotels']
    supabase
      .from('categories')
      .select('id, name, slug, icon')
      .then(({ data }) => {
        const sorted = (data as Category[] ?? []).sort((a, b) => {
          const ai = categoryOrder.indexOf(a.slug)
          const bi = categoryOrder.indexOf(b.slug)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        })
        setCategories(sorted)
      })
  }, [])

  const navItems = [
    {
      href: `/${locale}`,
      label: locale === 'ko' ? '홈' : 'Home',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: `/${locale}?sort=popular`,
      label: locale === 'ko' ? '인기' : 'Popular',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      href: `/${locale}?sort=latest`,
      label: locale === 'ko' ? '최신' : 'Latest',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ]

  const moreItems = [
    { href: `/${locale}/dashboard`, label: locale === 'ko' ? '대시보드' : 'Dashboard', emoji: '📊' },
    { href: `/${locale}/collections`, label: locale === 'ko' ? '컬렉션' : 'Collections', emoji: '📚' },
    { href: `/${locale}/battles`, label: locale === 'ko' ? '배틀' : 'Battles', emoji: '⚔️' },
    { href: `/${locale}/notifications`, label: locale === 'ko' ? '알림' : 'Notifications', emoji: '🔔' },
    { href: `/${locale}/admin`, label: locale === 'ko' ? '관리자' : 'Admin', emoji: '⚙️' },
  ]

  return (
    <>
    <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-64 bg-background border-r overflow-y-auto z-40">
      <div className="p-3 flex flex-col gap-0">
        {/* Main Navigation */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === `/${locale}` && pathname === `/${locale}`)
            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2"
                render={<Link href={item.href} />}
              >
                <span className="text-muted-foreground">{item.icon}</span>
                <span>{item.label}</span>
              </Button>
            )
          })}
        </nav>

        <Separator className="my-3" />

        {/* Categories — collapsible */}
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between px-1 mb-1"
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {locale === 'ko' ? '카테고리' : 'Categories'}
          </span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {categoriesOpen && (
          <nav className="space-y-0.5">
            {categories.map((cat) => {
              const catHref = `/${locale}/category/${cat.slug}`
              const isActive = pathname === catHref || pathname.startsWith(catHref + '/')
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                  render={<Link href={catHref} />}
                >
                  <CategoryIcon
                    name={cat.icon ?? 'folder'}
                    className="w-4 h-4 text-muted-foreground"
                  />
                  <span className="truncate">{cat.name[locale] ?? cat.name['ko']}</span>
                </Button>
              )
            })}
            {user && (
              <button
                onClick={() => setCategoryRequestOpen(true)}
                className="w-full text-left px-2 py-1.5 text-xs text-primary hover:bg-muted rounded-md transition-colors flex items-center gap-1.5"
              >
                <span>➕</span>
                {locale === 'ko' ? '카테고리 추가 요청' : 'Request New Category'}
              </button>
            )}
          </nav>
        )}

        <Separator className="my-3" />

        {/* More Features */}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1">
          {locale === 'ko' ? '더보기' : 'More'}
        </span>
        <nav className="space-y-0.5">
          {moreItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Button
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2"
                render={<Link href={item.href} />}
              >
                <span className="text-base leading-none">{item.emoji}</span>
                <span>{item.label}</span>
              </Button>
            )
          })}
        </nav>

        {/* Legal links */}
        <div className="mt-4 pt-3 border-t border-border flex gap-2 px-1 text-[10px] text-muted-foreground">
          <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">
            {locale === 'ko' ? '이용약관' : 'Terms'}
          </Link>
          <span>·</span>
          <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">
            {locale === 'ko' ? '개인정보처리방침' : 'Privacy'}
          </Link>
        </div>
      </div>
    </aside>
    {categoryRequestOpen && (
      <CategoryRequestModal locale={locale} onClose={() => setCategoryRequestOpen(false)} />
    )}
  </>
  )
}
