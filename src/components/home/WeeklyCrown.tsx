'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface CrownReview {
  id: string
  title: string
  content: string
  overall_rating: number
  helpful_count: number
  subject_id: string
  subject_name: string
  nickname: string
  trophySvg: string | null
}

interface WeeklyCrownProps {
  locale: string
}

const TROPHY_FALLBACK = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 12h24v4c0 8-4 14-12 16-8-2-12-8-12-16v-4z" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
  <path d="M12 12h8v6c-4 0-8-2-8-6z" fill="#fbbf24" opacity="0.7"/>
  <path d="M44 12h-8v6c4 0 8-2 8-6z" fill="#fbbf24" opacity="0.7" transform="scale(-1,1) translate(-56,0)"/>
  <rect x="26" y="32" width="12" height="4" rx="1" fill="#f59e0b"/>
  <rect x="22" y="36" width="20" height="6" rx="2" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="32" cy="20" r="4" fill="#fff" opacity="0.3"/>
  <path d="M28 8l4-4 4 4" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`

export default function WeeklyCrown({ locale }: WeeklyCrownProps) {
  const [crown, setCrown] = useState<CrownReview | null>(null)
  const [loading, setLoading] = useState(true)

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching on mount */
  useEffect(() => {
    async function fetchCrown() {
      const supabase = createClient()
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('reviews')
        .select('id, title, content, overall_rating, helpful_count, subject_id, subjects(name), public_profiles(nickname)')
        .gte('created_at', weekAgo)
        .order('helpful_count', { ascending: false })
        .limit(1)

      if (!data || data.length === 0) {
        setLoading(false)
        return
      }

      const r = data[0]
      const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
      const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
      const nameObj = (subject?.name ?? {}) as Record<string, string>

      let trophySvg: string | null = null
      try {
        const res = await fetch('/api/design/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'badge',
            prompt: `A golden trophy award badge for best review of the week. Crown on top, star in center, laurel wreath border. Gold and amber colors.`,
          }),
        })
        if (res.ok) {
          const { svg } = await res.json()
          trophySvg = svg
        }
      } catch {
        // Quiver AI unavailable, use fallback
      }

      setCrown({
        id: r.id,
        title: r.title,
        content: r.content.slice(0, 150),
        overall_rating: r.overall_rating,
        helpful_count: r.helpful_count,
        subject_id: r.subject_id,
        subject_name: nameObj[locale] ?? nameObj['ko'] ?? '',
        nickname: (profile?.nickname as string) ?? 'Anonymous',
        trophySvg,
      })
      setLoading(false)
    }

    fetchCrown()
  }, [locale])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-2xl ring-1 ring-amber-200/30 dark:ring-amber-800/30 h-48 animate-pulse" />
    )
  }

  if (!crown) return null

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-lg">👑</span>
        {locale === 'ko' ? '이번 주의 왕관' : 'Weekly Crown'}
      </h2>

      <Link
        href={`/${locale}/subject/${crown.subject_id}`}
        className="group block relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/30 rounded-2xl ring-1 ring-amber-200/40 dark:ring-amber-800/30 overflow-hidden hover:shadow-xl hover:ring-amber-300 transition-all"
      >
        {/* Gold shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(105deg, transparent 35%, rgba(251,191,36,0.1) 45%, rgba(251,191,36,0.2) 50%, rgba(251,191,36,0.1) 55%, transparent 65%)',
            animation: 'shimmer 3s infinite',
          }} />
        </div>

        <div className="relative flex gap-4 p-5">
          {/* Trophy */}
          <div className="shrink-0 w-20 h-20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16"
              dangerouslySetInnerHTML={{ __html: crown.trophySvg ?? TROPHY_FALLBACK }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-amber-500 text-sm"
              >
                👑
              </motion.span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                {locale === 'ko' ? '이번 주 최고 리뷰' : 'Best Review This Week'}
              </span>
            </div>

            <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
              &ldquo;{crown.title}&rdquo;
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 [word-break:keep-all]">{crown.content}...</p>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-yellow-500 font-medium">{'★'.repeat(Math.round(crown.overall_rating))}</span>
              <span className="text-muted-foreground">👍 {crown.helpful_count}</span>
              <span className="text-muted-foreground">— {crown.nickname}</span>
              <span className="text-muted-foreground">· {crown.subject_name}</span>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}
