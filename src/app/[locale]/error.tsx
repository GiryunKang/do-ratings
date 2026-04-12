'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <span className="text-4xl">😵</span>
      </div>
      <h2 className="text-xl font-bold mb-2">문제가 발생했습니다</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80">
          다시 시도
        </button>
        <Link href="/" className="h-9 px-4 border border-border rounded-lg text-sm font-medium flex items-center hover:bg-muted">
          홈으로
        </Link>
      </div>
    </div>
  )
}
