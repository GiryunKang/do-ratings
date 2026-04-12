'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  useEffect(() => {
    console.error('[ErrorBoundary]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center mb-4">
        <span className="text-4xl">😵</span>
      </div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        {locale === 'ko' ? '문제가 발생했습니다' : 'Something went wrong'}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {locale === 'ko'
          ? '페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.'
          : 'An error occurred while loading the page. Please try again.'}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {locale === 'ko' ? '다시 시도' : 'Try again'}
        </button>
        <Link
          href={`/${locale}`}
          className="px-6 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {locale === 'ko' ? '홈으로' : 'Go home'}
        </Link>
      </div>
    </div>
  )
}
