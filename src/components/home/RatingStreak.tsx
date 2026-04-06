'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface RatingStreakProps {
  locale: string
}

export default function RatingStreak({ locale }: RatingStreakProps) {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [showFlame, setShowFlame] = useState(false)

  useEffect(() => {
    if (!user) return

    async function fetchStreak() {
      if (!user) return
      const supabase = createClient()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('reviews')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) return

      const reviewDays = new Set(
        data.map(r => {
          const d = new Date(r.created_at)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        })
      )

      const today = new Date()
      let currentStreak = 0
      for (let i = 0; i < 30; i++) {
        const day = new Date(today)
        day.setDate(day.getDate() - i)
        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
        if (reviewDays.has(key)) {
          currentStreak++
        } else if (i > 0) {
          break
        }
      }

      setStreak(currentStreak)
      if (currentStreak >= 2) {
        setShowFlame(true)
      }
    }

    fetchStreak()
  }, [user])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!user || streak === 0) return null

  const flameSize = Math.min(streak, 7)
  const flameCount = streak >= 7 ? 3 : streak >= 3 ? 2 : 1

  return (
    <AnimatePresence>
      {showFlame && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative overflow-hidden rounded-xl bg-primary/5 border border-primary/20 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                className="flex items-center"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {Array.from({ length: flameCount }).map((_, i) => (
                  <Flame key={i} className="w-6 h-6 text-primary" />
                ))}
              </motion.span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {locale === 'ko'
                    ? `${streak}일 연속 평가!`
                    : `${streak}-day rating streak!`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {locale === 'ko'
                    ? '오늘도 리뷰를 작성하고 스트릭을 이어가세요'
                    : 'Write a review today to keep it going'}
                </p>
              </div>
            </div>

            {/* Flame intensity bar */}
            <div className="flex gap-0.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 rounded-full ${
                    i < flameSize ? 'bg-gradient-to-t from-primary to-orange-400' : 'bg-muted/40'
                  }`}
                  style={{ height: 8 + i * 3 }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
