'use client'

import { useEffect, useRef } from 'react'

interface InfiniteScrollProps {
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  children: React.ReactNode
}

export default function InfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  return (
    <div>
      {children}

      {/* Sentinel element */}
      <div ref={sentinelRef} className="h-px" />

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <svg
            className="animate-spin w-6 h-6 text-indigo-500"
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
        </div>
      )}

      {/* End of list */}
      {!hasMore && !loading && (
        <p className="text-center text-sm text-gray-400 py-6">— End —</p>
      )}
    </div>
  )
}
