'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Subject {
  id: string
  name: Record<string, string>
  avg_rating: number | null
  categories: { name: Record<string, string>; slug: string } | null
}

interface SearchBarProps {
  className?: string
}

export default function SearchBar({ className }: SearchBarProps) {
  const t = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Subject[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data ?? [])
        setOpen(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      fetchResults(query)
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, fetchResults])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false)
      router.push(`/${currentLocale}/explore?q=${encodeURIComponent(query.trim())}`)
    }
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  function getSubjectName(subject: Subject): string {
    return subject.name?.[currentLocale] ?? subject.name?.ko ?? subject.name?.en ?? ''
  }

  function getCategoryName(subject: Subject): string {
    if (!subject.categories) return ''
    return subject.categories.name?.[currentLocale] ?? subject.categories.name?.ko ?? ''
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={t('search')}
          className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:border-indigo-400 bg-gray-50"
          autoComplete="off"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
          {results.map((subject) => (
            <li key={subject.id}>
              <button
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors flex items-center justify-between gap-2"
                onMouseDown={() => {
                  setOpen(false)
                  router.push(`/${currentLocale}/subject/${subject.id}`)
                }}
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{getSubjectName(subject)}</span>
                  {getCategoryName(subject) && (
                    <span className="ml-2 text-xs text-gray-400">{getCategoryName(subject)}</span>
                  )}
                </div>
                {subject.avg_rating != null && (
                  <span className="text-xs font-semibold text-indigo-600 shrink-0">
                    ★ {subject.avg_rating.toFixed(1)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && query.trim() && !loading && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-gray-400">
          {t('noResults') ?? 'No results found'}
        </div>
      )}
    </div>
  )
}
