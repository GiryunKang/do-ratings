'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupFloatingBar() {
  const pathname = usePathname()
  const locale = pathname?.startsWith('/en') ? 'en' : 'ko'
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  useEffect(() => {
    if (isLoggedIn || dismissed) return

    function handleScroll() {
      setShow(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoggedIn, dismissed])

  if (isLoggedIn || dismissed || !show) return null

  const isAuthPage = pathname?.includes('/auth/')
  if (isAuthPage) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:bottom-4 md:left-4 md:right-4 animate-slideUp">
      <div className="mx-auto max-w-lg bg-card/95 backdrop-blur-lg border border-border rounded-t-2xl md:rounded-2xl shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground flex-1">
          {locale === 'ko'
            ? '가입하고 첫 리뷰를 남겨보세요'
            : 'Sign up and write your first review'}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/${locale}/auth/signup`}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold rounded-full hover:shadow-md hover:scale-105 transition-all"
          >
            {locale === 'ko' ? '가입하기' : 'Sign up'}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
