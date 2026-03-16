'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryIcon } from '@/lib/icons'

interface Category {
  id: string
  name: Record<string, string>
  slug: string
  icon: string | null
}

export default function Sidebar({ locale }: { locale: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name, slug, icon')
      .order('slug')
      .then(({ data }) => {
        setCategories((data as Category[]) ?? [])
      })
  }, [])

  const navItems = [
    {
      href: `/${locale}`,
      label: locale === 'ko' ? '홈' : 'Home',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: `/${locale}?sort=popular`,
      label: locale === 'ko' ? '인기' : 'Popular',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      href: `/${locale}?sort=latest`,
      label: locale === 'ko' ? '최신' : 'Latest',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
      <div className="p-3">
        {/* Navigation */}
        <ul className="space-y-0.5 mb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === `/${locale}` && pathname === `/${locale}`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-gray-400">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Divider */}
        <div className="border-t border-gray-200 my-3" />

        {/* Categories - collapsible */}
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between px-1 mb-2"
        >
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Categories
          </h2>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`}
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
          <ul className="space-y-0.5">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/${locale}/category/${cat.slug}`}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-50/50 hover:translate-x-0.5 transition-all duration-200"
                >
                  <CategoryIcon
                    name={cat.icon ?? 'folder'}
                    className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors"
                  />
                  <span className="truncate">{cat.name[locale] ?? cat.name['ko']}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
