'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { calculateProgress, koreaDayKey, type ExplorerProgress, type ExplorerReview } from './progress'

type ProgressState = {
  userId: string | null
  status: 'loading' | 'ready' | 'error'
  progress: ExplorerProgress | null
}

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export function usePlayerProgress() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<ProgressState>({ userId: null, status: 'loading', progress: null })
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    if (authLoading || !userId) return
    let cancelled = false
    let request = 0
    let observedDay = koreaDayKey(new Date())

    async function refresh() {
      const currentRequest = ++request
      setState({ userId, status: 'loading', progress: null })
      try {
        const supabase = createClient()
        const reviews: ExplorerReview[] = []
        // Page all rows: a 50/1000 row sampling cap must never be presented as lifetime progress.
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await supabase.from('reviews')
            .select('id, subject_id, created_at, subjects(category_id, categories(slug))')
            .eq('user_id', userId!)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(offset, offset + 499)
          if (cancelled || currentRequest !== request) return
          if (error) throw error
          for (const row of data ?? []) {
            const subject = first(row.subjects)
            const category = first(subject?.categories)
            reviews.push({ id: row.id, subjectId: row.subject_id, createdAt: row.created_at, categorySlug: category?.slug ?? null })
          }
          if ((data?.length ?? 0) < 500) break
        }
        if (!cancelled && currentRequest === request) {
          setState({ userId, status: 'ready', progress: calculateProgress(reviews) })
        }
      } catch {
        if (!cancelled && currentRequest === request) setState({ userId, status: 'error', progress: null })
      }
    }

    function onVisible() { if (document.visibilityState === 'visible') void refresh() }
    function onSaved() { void refresh() }
    void refresh()
    window.addEventListener('ratings:review-saved', onSaved)
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => {
      const day = koreaDayKey(new Date())
      if (day !== observedDay) { observedDay = day; void refresh() }
    }, 60000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('ratings:review-saved', onSaved)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, authLoading, revision])

  const status = authLoading ? 'loading' : !userId ? 'guest' : state.userId !== userId ? 'loading' : state.status
  return { status, progress: status === 'ready' ? state.progress : null, retry, user }
}
