'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import { useAuth } from '@/lib/hooks/useAuth'

interface QuickRateStarsProps {
  subjectId: string
  subjectName: string
  locale: string
  size?: 'sm' | 'md'
}

export default function QuickRateStars({ subjectId, subjectName, locale, size = 'sm' }: QuickRateStarsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)

  const starSize = size === 'sm' ? 'text-lg' : 'text-2xl'

  function handleClick(rating: number) {
    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }
    setSelected(rating)
    setShowFeedback(true)

    // Navigate to write page with pre-selected rating
    setTimeout(() => {
      router.push(`/${locale}/write/${subjectId}?rating=${rating * 2}`)
    }, 800)
  }

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1
        const isActive = starValue <= (hovered || selected)
        return (
          <motion.button
            key={i}
            type="button"
            whileTap={{ scale: 1.4 }}
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleClick(starValue)}
            className={`${starSize} transition-colors cursor-pointer ${isActive ? 'text-primary' : 'text-muted-foreground/20'}`}
            aria-label={`${starValue} stars`}
          >
            ★
          </motion.button>
        )
      })}

      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: -30 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute left-1/2 -translate-x-1/2 -top-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg"
          >
            {selected * 2}{locale === 'ko' ? '점! 상세 평가로 이동...' : ' points! Going to review...'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
