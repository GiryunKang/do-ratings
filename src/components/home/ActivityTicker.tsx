'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface Activity {
  id: string
  icon: string
  text: string
  timeAgo: string
}

interface ActivityTickerProps {
  locale: string
}

export default function ActivityTicker({ locale }: ActivityTickerProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching on mount */
  useEffect(() => {
    async function fetchActivity() {
      const supabase = createClient()

      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, title, overall_rating, created_at, public_profiles(nickname)')
        .order('created_at', { ascending: false })
        .limit(10)

      const { count: totalReviews } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })

      const { count: totalSubjects } = await supabase
        .from('subjects')
        .select('id', { count: 'exact', head: true })

      const { count: totalUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })

      const items: Activity[] = []

      for (const r of reviews ?? []) {
        const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
        const nickname = (profile?.nickname as string) ?? 'Someone'
        const stars = '★'.repeat(Math.round(r.overall_rating))
        items.push({
          id: r.id,
          icon: '✍️',
          text: locale === 'ko'
            ? `${nickname}님이 "${r.title}" 리뷰를 작성했습니다 ${stars}`
            : `${nickname} wrote "${r.title}" ${stars}`,
          timeAgo: formatTimeAgo(r.created_at, locale),
        })
      }

      items.push({
        id: 'stat-reviews',
        icon: '📊',
        text: locale === 'ko'
          ? `지금까지 총 ${totalReviews ?? 0}개의 리뷰가 작성되었습니다`
          : `${totalReviews ?? 0} reviews written so far`,
        timeAgo: '',
      })

      items.push({
        id: 'stat-subjects',
        icon: '🌍',
        text: locale === 'ko'
          ? `${totalSubjects ?? 0}개의 대상이 등록되어 평가를 기다리고 있습니다`
          : `${totalSubjects ?? 0} subjects waiting to be rated`,
        timeAgo: '',
      })

      items.push({
        id: 'stat-users',
        icon: '👥',
        text: locale === 'ko'
          ? `${totalUsers ?? 0}명의 리뷰어가 참여하고 있습니다`
          : `${totalUsers ?? 0} reviewers have joined`,
        timeAgo: '',
      })

      setActivities(items)
    }

    fetchActivity()
  }, [locale])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (activities.length === 0) return
    intervalRef.current = setInterval(() => {
      setCurrentIndex(i => (i + 1) % activities.length)
    }, 4000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activities.length])

  if (activities.length === 0) return null

  const current = activities[currentIndex]

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 ring-1 ring-foreground/[0.04] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          {locale === 'ko' ? '실시간' : 'Live'}
        </span>
        <div className="flex-1 min-w-0 h-5 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center gap-2 text-sm text-foreground/80 truncate"
            >
              <span>{current.icon}</span>
              <span className="truncate">{current.text}</span>
              {current.timeAgo && (
                <span className="text-[11px] text-muted-foreground shrink-0">{current.timeAgo}</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (locale === 'ko') {
    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금'
  }

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
