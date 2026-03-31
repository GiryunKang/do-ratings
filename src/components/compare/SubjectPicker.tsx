'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { proxyImageUrl } from '@/lib/utils/image-proxy'

interface PickedSubject {
  id: string
  name: Record<string, string>
  image_url: string | null
  avg_rating: number | null
  review_count: number
  category_id: string
}

interface SubjectPickerProps {
  categoryId: string | null
  locale: string
  onSelect: (subject: PickedSubject) => void
  onClose: () => void
  excludeIds: string[]
}

export default function SubjectPicker({
  categoryId,
  locale,
  onSelect,
  onClose,
  excludeIds,
}: SubjectPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<PickedSubject[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ESC key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Fetch subjects with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        let query = supabase
          .from('subjects')
          .select('id, name, image_url, avg_rating, review_count, category_id')
          .order('review_count', { ascending: false })
          .limit(20)

        if (categoryId) {
          query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query

        if (error) {
          console.error('SubjectPicker fetch error:', error)
          setResults([])
          return
        }

        const term = searchTerm.trim().toLowerCase()
        let filtered = (data ?? []) as PickedSubject[]

        // Client-side name filter
        if (term) {
          filtered = filtered.filter((subject) => {
            const nameKo = (subject.name?.['ko'] ?? '').toLowerCase()
            const nameEn = (subject.name?.['en'] ?? '').toLowerCase()
            return nameKo.includes(term) || nameEn.includes(term)
          })
        }

        // Exclude already selected subjects
        filtered = filtered.filter((s) => !excludeIds.includes(s.id))

        setResults(filtered)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm, categoryId, excludeIds])

  const handleSelect = (subject: PickedSubject) => {
    onSelect(subject)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="max-w-md mx-auto mt-20 bg-card rounded-xl p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={locale === 'ko' ? '검색...' : 'Search...'}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
        />

        {/* Category lock note */}
        {categoryId && (
          <p className="text-xs text-indigo-500 mb-2">
            {locale === 'ko' ? '같은 카테고리만 표시됩니다' : 'Same category only'}
          </p>
        )}

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              {locale === 'ko' ? '로딩 중...' : 'Loading...'}
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {locale === 'ko' ? '결과가 없습니다' : 'No results found'}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((subject) => {
                const displayName =
                  subject.name[locale] ??
                  subject.name['ko'] ??
                  Object.values(subject.name)[0] ??
                  ''
                return (
                  <li key={subject.id}>
                    <button
                      onClick={() => handleSelect(subject)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 text-left hover:bg-indigo-50 dark:bg-indigo-950/30 rounded-lg transition-colors"
                    >
                      {/* Thumbnail or placeholder */}
                      {subject.image_url ? (
                        <img
                          src={proxyImageUrl(subject.image_url) ?? ''}
                          alt={displayName}
                          className="w-10 h-10 rounded-md object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-base font-bold shrink-0 select-none">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name + stats */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {displayName}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          {subject.avg_rating !== null
                            ? subject.avg_rating.toFixed(1)
                            : '—'}
                          <span className="mx-1">·</span>
                          {subject.review_count.toLocaleString()}{' '}
                          {locale === 'ko' ? '리뷰' : 'reviews'}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
        >
          {locale === 'ko' ? '닫기' : 'Close'}
        </button>
      </div>
    </div>
  )
}
