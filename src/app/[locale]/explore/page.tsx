'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import SearchBar from '@/components/search/SearchBar'
import FilterPanel from '@/components/search/FilterPanel'
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

export default function ExplorePage() {
  const t = useTranslations('common')
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  const initialQ = searchParams.get('q') ?? ''

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ category: null, ratingMin: null })
  const [showFilters, setShowFilters] = useState(false)

  // Load categories once
  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('id, name, slug').order('slug')
      if (data) setCategories(data)
    }
    loadCategories()
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
      {/* Page header */}
      <div className="mb-6 space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('explore') ?? 'Explore'}
        </h1>
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
            <p className="text-sm text-gray-500 mb-4">
              {loading ? '' : `${subjects.length} ${t('results') ?? 'results'} for "${initialQ}"`}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-28 animate-pulse" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">{t('noResults') ?? 'No results found'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/${currentLocale}/subject/${subject.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                    {getSubjectName(subject)}
                  </p>
                  {getCategoryName(subject) && (
                    <p className="text-xs text-gray-400 mb-1">{getCategoryName(subject)}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-auto">
                    {subject.avg_rating != null ? (
                      <>
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-sm font-bold text-gray-800">{subject.avg_rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({subject.review_count})</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">{t('noReviews') ?? 'No reviews'}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
