'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Bookmark, ChevronDown, Compass, Flag, Home, Plus, Sparkles, Swords } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CategoryIcon } from '@/lib/icons'
import { useAuth } from '@/lib/hooks/useAuth'
import CategoryRequestModal from '@/components/category/CategoryRequestModal'

type Category = { id: string; slug: string; name: Record<string, string>; icon: string | null }
export default function Sidebar({ locale }: { locale: string }) {
  const ko = locale === 'ko'
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(true)
  const [requestOpen, setRequestOpen] = useState(false)
  useEffect(() => {
    let cancelled = false
    createClient().from('categories').select('id,slug,name,icon').order('slug').then(({ data }) => { if (!cancelled && data) setCategories(data) })
    return () => { cancelled = true }
  }, [])
  const nav = [
    { path: '', title: ko ? '?' : 'Home', icon: Home },
    { path: '/explore', title: ko ? '????' : 'Explore', icon: Compass },
    { path: '/play', title: ko ? '?? ??' : 'Taste quest', icon: Flag },
    { path: '/rankings', title: ko ? '??' : 'Rankings', icon: BarChart3 },
    { path: '/collections', title: ko ? '? ???' : 'Collections', icon: Bookmark },
  ]
  const linkClass = (active: boolean) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? 'bg-secondary/10 font-semibold text-secondary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`
  return <>
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-56 flex-col overflow-y-auto border-r border-border bg-background p-4 lg:flex">
      <nav aria-label={ko ? '? ??' : 'Main navigation'} className="space-y-1">{nav.map(item => <Link key={item.path} href={`/${locale}${item.path}`} aria-current={pathname === `/${locale}${item.path}` ? 'page' : undefined} className={linkClass(pathname === `/${locale}${item.path}`)}><item.icon size={18} />{item.title}</Link>)}</nav>
      <div className="my-4 border-t border-border" />
      <button type="button" aria-expanded={open} aria-controls="sidebar-categories" onClick={() => setOpen(value => !value)} className="flex min-h-11 w-full items-center justify-between px-3 text-xs font-semibold text-muted-foreground">{ko ? '??? ??' : 'CATEGORIES'}<ChevronDown size={16} className={open ? 'rotate-180' : ''} /></button>
      {open && <nav id="sidebar-categories" aria-label={ko ? '??? ??' : 'Categories'} className="space-y-1">{categories.map(cat => <Link key={cat.id} href={`/${locale}/category/${cat.slug}`} className={linkClass(pathname.includes(`/category/${cat.slug}`))} aria-current={pathname.includes(`/category/${cat.slug}`) ? 'page' : undefined}><CategoryIcon name={cat.icon ?? 'folder'} className="h-4 w-4 shrink-0" /><span>{cat.name[locale] || cat.name.ko || cat.name.en}</span></Link>)}<button type="button" onClick={() => user ? setRequestOpen(true) : router.push(`/${locale}/auth/login`)} className="flex min-h-11 items-center gap-2 px-3 text-xs text-secondary"><Plus size={15} />{ko ? '? ?? ??' : 'Suggest a category'}</button></nav>}
      <div className="my-4 border-t border-border" />
      <nav aria-label={ko ? '? ????' : 'More to explore'} className="space-y-1">{[{ path: 'discover', label: ko ? '??' : 'Discover', icon: Compass }, { path: 'highlights', label: ko ? '?????' : 'Highlights', icon: Sparkles }, { path: 'battles', label: ko ? '??' : 'Battles', icon: Swords }].map(item => <Link key={item.path} href={`/${locale}/${item.path}`} className={linkClass(pathname === `/${locale}/${item.path}`)}><item.icon size={17} />{item.label}</Link>)}</nav>
      <p className="mt-auto px-3 pt-8 text-xs leading-5 text-muted-foreground">{ko ? '?? ?? ??? ??? ??? ??.' : 'A small review can spark a new discovery.'}</p>
    </aside>
    {requestOpen && <CategoryRequestModal locale={locale} onClose={() => setRequestOpen(false)} />}
  </>
}
