'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface FetchResult<T> {
  data: T[]
  nextCursor: string | null
}

interface UseInfiniteScrollResult<T> {
  items: T[]
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  reset: () => void
}

export function useInfiniteScroll<T>(
  fetchFn: (cursor: string | null) => Promise<FetchResult<T>>
): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const cursorRef = useRef<string | null>(null)
  const fetchFnRef = useRef(fetchFn)
  const initializedRef = useRef(false)

  // Keep fetchFn ref up to date without causing re-renders
  useEffect(() => {
    fetchFnRef.current = fetchFn
  })

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const result = await fetchFnRef.current(cursorRef.current)
      setItems((prev) => [...prev, ...result.data])
      cursorRef.current = result.nextCursor
      setHasMore(result.nextCursor !== null)
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore])

  // Initial load
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-load after reset (items cleared, hasMore restored, not initialized)
  useEffect(() => {
    if (!initializedRef.current && items.length === 0 && hasMore) {
      initializedRef.current = true
      loadMore()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, hasMore])

  const reset = useCallback(() => {
    setItems([])
    cursorRef.current = null
    setHasMore(true)
    initializedRef.current = false
  }, [])

  return { items, loading, hasMore, loadMore, reset }
}
