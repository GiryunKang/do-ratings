'use client'

import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RootErrorBoundary]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <span className="text-4xl">😵</span>
      </div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        An error occurred while loading the page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  )
}
