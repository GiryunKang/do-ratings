'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPinIcon } from '@/lib/icons'

interface PlaceResult {
  google_place_id: string
  name: string
  address: string
  rating: number | null
  user_ratings_total: number
  types: string[]
  lat: number | null
  lng: number | null
}

interface PlaceSearchProps {
  categorySlug: 'places' | 'restaurants'
  locale: string
}

export default function PlaceSearch({ categorySlug, locale }: PlaceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const type = categorySlug === 'restaurants' ? '&type=restaurant' : ''
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}${type}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [categorySlug])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 400)
  }

  async function handleAddPlace(place: PlaceResult) {
    setAdding(place.google_place_id)
    setError(null)
    try {
      const res = await fetch('/api/places/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_place_id: place.google_place_id,
          name: place.name,
          address: place.address,
          rating: place.rating,
          category_slug: categorySlug,
          lat: place.lat,
          lng: place.lng,
        }),
      })
      const data = await res.json()
      if (data.error) {
        if (res.status === 401) {
          setError(locale === 'ko' ? '로그인이 필요합니다' : 'Login required')
        } else {
          setError(data.error)
        }
        return
      }
      if (data.id) {
        router.push(`/${locale}/subject/${data.id}`)
      }
    } catch {
      setError(locale === 'ko' ? '추가에 실패했습니다. 다시 시도해주세요.' : 'Failed to add. Please try again.')
    } finally {
      setAdding(null)
    }
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-6">
      <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
        <MapPinIcon className="w-4 h-4 text-indigo-500" />
        {locale === 'ko'
          ? (categorySlug === 'restaurants' ? 'Google에서 레스토랑 검색' : 'Google에서 장소 검색')
          : (categorySlug === 'restaurants' ? 'Search restaurants on Google' : 'Search places on Google')
        }
      </h3>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={locale === 'ko' ? '장소명을 입력하세요...' : 'Enter a place name...'}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-3 divide-y divide-border max-h-80 overflow-y-auto">
          {results.map((place) => (
            <li key={place.google_place_id} className="py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <MapPinIcon className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{place.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{place.address}</p>
                {place.rating && (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    ★ {place.rating} ({place.user_ratings_total.toLocaleString()})
                  </p>
                )}
              </div>
              <button
                onClick={() => handleAddPlace(place)}
                disabled={adding === place.google_place_id}
                className="text-xs font-medium text-white bg-indigo-600 rounded-full px-3 py-1.5 hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
              >
                {adding === place.google_place_id
                  ? '...'
                  : (locale === 'ko' ? '리뷰하기' : 'Review')
                }
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center py-3 bg-red-50 rounded-lg mt-3">
          {error}
        </p>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {locale === 'ko' ? '검색 결과가 없습니다' : 'No results found'}
        </p>
      )}
    </div>
  )
}
