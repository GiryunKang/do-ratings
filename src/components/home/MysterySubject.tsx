'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Lock, Star } from 'lucide-react'

import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface SubjectData {
  id: string
  name: Record<string, string>
  category_slug: string
  category_icon: string
  category_name: Record<string, string>
  avg_rating: number | null
  review_count: number
}

interface MysterySubjectProps {
  locale: string
  subjects?: SubjectData[]
}

export default function MysterySubject({ locale, subjects: subjectsProp }: MysterySubjectProps) {
  const [revealed, setRevealed] = useState(false)
  const [countdown, setCountdown] = useState('')

  const revealHour = 12

  const isRevealTime = useMemo(() => {
    const now = new Date()
    return now.getHours() >= revealHour
  }, [])

  const subject = useMemo(() => {
    if (!subjectsProp || subjectsProp.length === 0) return null
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const index = seed % subjectsProp.length
    return subjectsProp[index]
  }, [subjectsProp])

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
        <Sparkles className="w-5 h-5 text-violet-500" />
        {locale === 'ko' ? '오늘의 미스터리' : 'Mystery of the Day'}
      </h2>

      <div className="relative bg-card rounded-2xl ring-1 ring-border overflow-hidden">
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
                className="flex justify-center mb-3"
              >
                <Lock className="w-12 h-12 text-violet-400" />
              </motion.div>

              <p className="font-bold text-foreground mb-1">
                {locale === 'ko' ? '정오에 공개됩니다' : 'Reveals at noon'}
              </p>

              {countdown && (
                <div className="flex items-center justify-center gap-1 text-lg font-mono font-bold text-primary">
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex mb-3"
                >
                  <Star className="w-10 h-10 text-violet-400 fill-violet-300" />
                </motion.div>

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
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-foreground text-background rounded-full shadow-md hover:shadow-lg hover:opacity-90 active:scale-95 transition-opacity"
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
