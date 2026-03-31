'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface MysterySubjectProps {
  locale: string
}

interface SubjectData {
  id: string
  name: Record<string, string>
  category_slug: string
  category_icon: string
  category_name: Record<string, string>
  avg_rating: number | null
  review_count: number
}

export default function MysterySubject({ locale }: MysterySubjectProps) {
  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [countdown, setCountdown] = useState('')

  const revealHour = 12

  const isRevealTime = useMemo(() => {
    const now = new Date()
    return now.getHours() >= revealHour
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching on mount */
  useEffect(() => {
    async function fetchMystery() {
      const supabase = createClient()

      const today = new Date()
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name, avg_rating, review_count, categories(slug, name, icon)')
        .limit(200)

      if (!subjects || subjects.length === 0) return

      const index = seed % subjects.length
      const picked = subjects[index]
      const cat = Array.isArray(picked.categories) ? picked.categories[0] : picked.categories

      setSubject({
        id: picked.id,
        name: picked.name as Record<string, string>,
        category_slug: (cat?.slug ?? '') as string,
        category_icon: (cat?.icon ?? 'folder') as string,
        category_name: (cat?.name ?? {}) as Record<string, string>,
        avg_rating: picked.avg_rating,
        review_count: picked.review_count,
      })
    }

    fetchMystery()
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), revealHour, 0, 0)

      if (now >= target) {
        setCountdown('')
        return
      }

      const diff = target.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h}h ${m}m ${s}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!subject) return null

  const name = subject.name[locale] ?? subject.name['ko'] ?? ''
  const catName = subject.category_name[locale] ?? subject.category_name['ko'] ?? ''
  const color = getCategoryColor(subject.category_slug)

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-lg">🔮</span>
        {locale === 'ko' ? '오늘의 미스터리' : 'Mystery of the Day'}
      </h2>

      <div className="relative bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-purple-500/10 rounded-2xl ring-1 ring-violet-200/30 dark:ring-violet-800/30 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isRevealTime && !revealed ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 text-center"
            >
              {/* Lock animation */}
              <motion.div
                animate={{ rotate: [0, -3, 3, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-5xl mb-3"
              >
                🔒
              </motion.div>

              <p className="font-bold text-foreground mb-1">
                {locale === 'ko' ? '정오에 공개됩니다' : 'Reveals at noon'}
              </p>

              {countdown && (
                <div className="flex items-center justify-center gap-1 text-lg font-mono font-bold text-violet-600 dark:text-violet-400">
                  {countdown.split(' ').map((part, i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    >
                      {part}
                    </motion.span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setRevealed(true)}
                className="mt-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                {locale === 'ko' ? '지금 미리 보기 👀' : 'Peek now 👀'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, rotateX: 90 }}
              animate={{ opacity: 1, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="p-6"
              style={{ perspective: 600 }}
            >
              <div className="text-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="inline-block text-4xl mb-3"
                >
                  ✨
                </motion.span>

                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <span className={`w-5 h-5 rounded-full ${color} flex items-center justify-center`}>
                    <CategoryIcon name={subject.category_icon} className="w-3 h-3 text-white" />
                  </span>
                  <span className="text-xs text-muted-foreground">{catName}</span>
                </div>

                <h3 className="text-xl font-black text-foreground mb-2">{name}</h3>

                {subject.avg_rating != null ? (
                  <p className="text-yellow-500 font-bold mb-3">★ {subject.avg_rating.toFixed(1)} · {subject.review_count} {locale === 'ko' ? '리뷰' : 'reviews'}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">
                    {locale === 'ko' ? '아직 리뷰가 없습니다 — 첫 번째가 되어보세요!' : 'No reviews yet — be the first!'}
                  </p>
                )}

                <Link
                  href={`/${locale}/subject/${subject.id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  {locale === 'ko' ? '평가하기' : 'Rate Now'} →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
