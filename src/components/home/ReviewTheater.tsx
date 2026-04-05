'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clapperboard } from 'lucide-react'

interface TheaterReview {
  id: string
  title: string
  content: string
  overall_rating: number
  subject_name: string
  nickname: string
}

interface ReviewTheaterProps {
  locale: string
  initialReviews?: TheaterReview[]
}

export default function ReviewTheater({ locale, initialReviews }: ReviewTheaterProps) {
  const [reviews] = useState<TheaterReview[]>(initialReviews ?? [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [phase, setPhase] = useState<'title' | 'content' | 'pause'>('title')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const typeText = useCallback((text: string, onComplete: () => void) => {
    setIsTyping(true)
    setDisplayedText('')
    let i = 0

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1))
        i++
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsTyping(false)
        onComplete()
      }
    }, 40)
  }, [])

  useEffect(() => {
    if (reviews.length === 0) return

    const review = reviews[currentIndex % reviews.length]

    if (phase === 'title') {
      typeText(`"${review.title}"`, () => {
        setTimeout(() => setPhase('content'), 800)
      })
    } else if (phase === 'content') {
      typeText(review.content + (review.content.length >= 200 ? '...' : ''), () => {
        setPhase('pause')
      })
    } else if (phase === 'pause') {
      const timer = setTimeout(() => {
        setCurrentIndex(i => i + 1)
        setPhase('title')
      }, 4000)
      return () => clearTimeout(timer)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [reviews, currentIndex, phase, typeText])

  if (reviews.length === 0) return null

  const review = reviews[currentIndex % reviews.length]
  const stars = '★'.repeat(Math.round(review.overall_rating)) + '☆'.repeat(5 - Math.round(review.overall_rating))

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <Clapperboard className="w-5 h-5 text-amber-500" />
        {locale === 'ko' ? '리뷰 극장' : 'Review Theater'}
      </h2>

      <div className="relative bg-gradient-to-b from-gray-950 to-gray-900 rounded-2xl overflow-hidden min-h-[200px]">
        {/* Stage curtain effect */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-800 via-red-600 to-red-800" />

        {/* Spotlight */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 60% 80% at 50% 30%, rgba(255,255,255,0.15), transparent)',
          }}
        />

        <div className="relative z-10 p-6 md:p-8 text-center">
          {/* Subject & Author */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`meta-${currentIndex}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <p className="text-amber-400/80 text-xs font-medium tracking-wider uppercase mb-1">
                {review.subject_name}
              </p>
              <p className="text-amber-300 text-sm tracking-widest">{stars}</p>
            </motion.div>
          </AnimatePresence>

          {/* Typewriter text */}
          <div className="min-h-[80px] flex items-center justify-center">
            <p className={`text-white/90 max-w-lg mx-auto leading-relaxed [word-break:keep-all] ${
              phase === 'title' ? 'text-lg md:text-xl font-bold' : 'text-sm md:text-base'
            }`}>
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-5 bg-amber-400 ml-0.5 align-middle"
                />
              )}
            </p>
          </div>

          {/* Author credit */}
          {phase === 'pause' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/40 text-xs mt-4"
            >
              — {review.nickname}
            </motion.p>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-5">
            {reviews.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex % Math.min(reviews.length, 5) ? 'bg-amber-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
