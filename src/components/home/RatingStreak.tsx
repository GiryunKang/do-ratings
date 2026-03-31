'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface RatingStreakProps {
  locale: string
}

export default function RatingStreak({ locale }: RatingStreakProps) {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [showFlame, setShowFlame] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching on mount */
  useEffect(() => {
    if (!user) return

    async function fetchStreak() {
      if (!user) return
      const supabase = createClient()
      const today = new Date()
      let currentStreak = 0

      for (let i = 0; i < 30; i++) {
        const day = new Date(today)
        day.setDate(day.getDate() - i)
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString()
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString()

        const { count } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd)

        if ((count ?? 0) > 0) {
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
  const flameEmojis = streak >= 7 ? '🔥🔥🔥' : streak >= 3 ? '🔥🔥' : '🔥'

  return (
    <AnimatePresence>
      {showFlame && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-amber-500/10 ring-1 ring-orange-200/30 dark:ring-orange-800/30 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                className="text-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {flameEmojis}
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
                    i < flameSize ? 'bg-gradient-to-t from-orange-500 to-amber-400' : 'bg-muted/40'
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
