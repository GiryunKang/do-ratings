'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import SearchBar from '@/components/search/SearchBar'
import FilterPanel from '@/components/search/FilterPanel'
import AddSubjectModal from '@/components/subject/AddSubjectModal'
import { createClient } from '@/lib/supabase/client'

interface Subject {
  id: string
  name: Record<string, string>
  avg_rating: number | null
  review_count: number
  categories: { id: string; name: Record<string, string>; slug: string } | null
}

interface Category {
  id: string
  name: Record<string, string>
  slug: string
}

interface FilterState {
  category: string | null
  ratingMin: number | null
}

// Rotate through accent colors based on category slug
const categoryAccents: Record<string, string> = {
  food: 'border-orange-400',
  restaurant: 'border-orange-400',
  hotel: 'border-blue-400',
  travel: 'border-cyan-400',
  attraction: 'border-green-400',
  beauty: 'border-pink-400',
  shopping: 'border-purple-400',
  entertainment: 'border-yellow-400',
  health: 'border-red-400',
  education: 'border-indigo-400',
}

const accentFallbacks = [
  'border-indigo-400',
  'border-purple-400',
  'border-pink-400',
  'border-orange-400',
  'border-teal-400',
  'border-cyan-400',
]

function getCategoryAccent(slug: string | undefined, index: number): string {
  if (slug && categoryAccents[slug]) return categoryAccents[slug]
  return accentFallbacks[index % accentFallbacks.length]
}

export default function ExplorePage() {
  const t = useTranslations('common')
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  const initialQ = searchParams.get('q') ?? ''

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [popularSubjects, setPopularSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ category: null, ratingMin: null })
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Load categories, auth state, and popular subjects once
  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const [{ data: catData }, { data: { user } }, { data: popularData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug').order('slug'),
        supabase.auth.getUser(),
        supabase
          .from('subjects')
          .select('id, name, avg_rating, review_count, categories(id, name, slug)')
          .order('review_count', { ascending: false })
          .limit(12),
      ])
      if (catData) setCategories(catData)
      setIsLoggedIn(!!user)
      if (popularData) setPopularSubjects(popularData as unknown as Subject[])
    }
    loadData()
  }, [])

  const fetchSubjects = useCallback(async (q: string, f: FilterState) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (f.category) params.set('category', f.category)
      if (f.ratingMin) params.set('rating_min', String(f.ratingMin))
      const res = await fetch(`/api/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSubjects(data ?? [])
      }
    } catch {
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and when filters/q change
  useEffect(() => {
    fetchSubjects(initialQ, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Fetch when URL q param changes (navigating from header search)
  useEffect(() => {
    fetchSubjects(initialQ, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ])

  function getSubjectName(subject: Subject): string {
    return subject.name?.[currentLocale] ?? subject.name?.ko ?? subject.name?.en ?? ''
  }

  function getCategoryName(subject: Subject): string {
    if (!subject.categories) return ''
    return subject.categories.name?.[currentLocale] ?? subject.categories.name?.ko ?? ''
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Add Subject Modal */}
      {showAddModal && (
        <AddSubjectModal
          onClose={() => setShowAddModal(false)}
          defaultCategorySlug={filters.category ?? undefined}
        />
      )}

      {/* Page header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            {t('explore') ?? 'Explore'}
          </h1>
          {isLoggedIn && (
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {currentLocale === 'ko' ? '항목 추가' : 'Add Subject'}
            </button>
          )}
        </div>
        <SearchBar className="max-w-xl" />

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="md:hidden flex items-center gap-1.5 text-sm text-indigo-600 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {t('filter') ?? 'Filters'}
          {(filters.category || filters.ratingMin) && (
            <span className="ml-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {[filters.category, filters.ratingMin].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* FilterPanel — desktop always visible, mobile collapsible */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <FilterPanel
            categories={categories}
            selectedCategory={filters.category}
            ratingMin={filters.ratingMin}
            onFilterChange={setFilters}
          />
        </div>

        {/* Results */}
        <div className="flex-1">
          {initialQ && (
            <p className="text-sm text-muted-foreground mb-4">
              {loading ? '' : `${subjects.length} ${t('results') ?? 'results'} for "${initialQ}"`}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border h-28 animate-pulse" />
              ))}
            </div>
          ) : !initialQ && !filters.category && !filters.ratingMin ? (
            /* No search active — show popular subjects */
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {currentLocale === 'ko' ? '인기 항목' : 'Popular'}
              </p>
              {popularSubjects.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border h-28 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {popularSubjects.map((subject, index) => {
                    const accentClass = getCategoryAccent(subject.categories?.slug, index)
                    return (
                      <Link
                        key={subject.id}
                        href={`/${currentLocale}/subject/${subject.id}`}
                        className={`bg-card rounded-xl border-l-4 border border-border p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${accentClass}`}
                      >
                        <p className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                          {getSubjectName(subject)}
                        </p>
                        {getCategoryName(subject) && (
                          <p className="text-xs text-muted-foreground mb-1">{getCategoryName(subject)}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-auto">
                          {subject.avg_rating != null ? (
                            <>
                              <span className="text-yellow-400 text-sm">★</span>
                              <span className="text-sm font-bold text-foreground">{subject.avg_rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({subject.review_count})</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t('noReviews') ?? 'No reviews'}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 64 64" fill="none">
                <circle cx="28" cy="28" r="18" stroke="#c7d2fe" strokeWidth="3" />
                <circle cx="28" cy="28" r="10" fill="#e0e7ff" />
                <path d="M41 41l10 10" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                <path d="M24 24h8M24 30h5" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-medium text-muted-foreground mb-1">{t('noResults') ?? 'No results found'}</p>
              <p className="text-xs text-muted-foreground">{currentLocale === 'ko' ? '필터 또는 검색어를 조정해보세요' : 'Try adjusting your filters or search term'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {subjects.map((subject, index) => {
                const accentClass = getCategoryAccent(subject.categories?.slug, index)
                return (
                  <Link
                    key={subject.id}
                    href={`/${currentLocale}/subject/${subject.id}`}
                    className={`bg-card rounded-xl border-l-4 border border-border p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${accentClass}`}
                  >
                    <p className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                      {getSubjectName(subject)}
                    </p>
                    {getCategoryName(subject) && (
                      <p className="text-xs text-muted-foreground mb-1">{getCategoryName(subject)}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-auto">
                      {subject.avg_rating != null ? (
                        <>
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-sm font-bold text-foreground">{subject.avg_rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({subject.review_count})</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('noReviews') ?? 'No reviews'}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating "+" button — mobile only, logged-in users */}
      {isLoggedIn && (
        <button
          onClick={() => setShowAddModal(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          aria-label={currentLocale === 'ko' ? '항목 추가' : 'Add Subject'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  )
}
