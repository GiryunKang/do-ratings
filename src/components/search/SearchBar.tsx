'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import AddSubjectModal from '@/components/subject/AddSubjectModal'

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
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showAddModal, setShowAddModal] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data ?? [])
        setOpen(true)
        setActiveIndex(-1)
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
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        setOpen(false)
        setActiveIndex(-1)
        router.push(`/${currentLocale}/subject/${results[activeIndex].id}`)
      } else if (query.trim()) {
        setOpen(false)
        setActiveIndex(-1)
        router.push(`/${currentLocale}/explore?q=${encodeURIComponent(query.trim())}`)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
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
    <>
    {showAddModal && <AddSubjectModal onClose={() => setShowAddModal(false)} />}
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
          className="w-full pl-9 pr-4 py-1.5 rounded-full border border-border text-sm focus:outline-none focus:border-indigo-400 bg-muted/50"
          autoComplete="off"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
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
        <ul className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto animate-slideDown">
          {results.map((subject, index) => (
            <li key={subject.id}>
              <button
                className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-2 ${
                  index === activeIndex ? 'bg-indigo-50' : 'hover:bg-indigo-50'
                }`}
                onMouseDown={() => {
                  setOpen(false)
                  setActiveIndex(-1)
                  router.push(`/${currentLocale}/subject/${subject.id}`)
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <div>
                  <span className="text-sm font-medium text-foreground">{getSubjectName(subject)}</span>
                  {getCategoryName(subject) && (
                    <span className="ml-2 text-xs text-muted-foreground">{getCategoryName(subject)}</span>
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
          {/* Hint at bottom */}
          <li className="px-4 py-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Press Enter to search all</p>
          </li>
        </ul>
      )}

      {open && results.length === 0 && query.trim() && !loading && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 px-4 py-3 text-sm animate-slideDown">
          <p className="text-muted-foreground">{t('noResults') ?? 'No results found'}</p>
          <button
            onMouseDown={() => {
              setOpen(false)
              setShowAddModal(true)
            }}
            className="mt-1.5 text-xs text-indigo-600 hover:underline"
          >
            {currentLocale === 'ko'
              ? '찾는 대상이 없나요? 직접 추가하기 →'
              : "Can't find what you're looking for? Add it yourself →"}
          </button>
        </div>
      )}
    </div>
    </>
  )
}
