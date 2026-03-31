'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface RouletteSubject {
  id: string
  name: Record<string, string>
  category_slug: string
  category_icon: string
  category_name: Record<string, string>
  image_url: string | null
}

interface RatingRouletteProps {
  subjects: RouletteSubject[]
  locale: string
}

const CATEGORY_EMOJIS: Record<string, string> = {
  airlines: '✈️', hotels: '🏨', restaurants: '🍽️',
  companies: '🏢', places: '📍', people: '👤',
}

export default function RatingRoulette({ subjects, locale }: RatingRouletteProps) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<RouletteSubject | null>(null)
  const [rotation, setRotation] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const spin = useCallback(() => {
    if (spinning || subjects.length === 0) return
    setSpinning(true)
    setShowResult(false)

    const randomIndex = Math.floor(Math.random() * subjects.length)
    const newRotation = rotation + 1440 + Math.random() * 720

    setRotation(newRotation)

    setTimeout(() => {
      setResult(subjects[randomIndex])
      setSpinning(false)
      setShowResult(true)
    }, 2000)
  }, [spinning, subjects, rotation])

  if (subjects.length === 0) return null

  const uniqueSlugs = [...new Set(subjects.map(s => s.category_slug))]

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-lg">🎰</span>
        {locale === 'ko' ? '평가 룰렛' : 'Rating Roulette'}
      </h2>

      <div className="flex flex-col items-center gap-4">
        {/* Wheel */}
        <div className="relative w-48 h-48">
          <motion.div
            className="w-full h-full rounded-full border-4 border-indigo-200 dark:border-indigo-800 shadow-lg relative overflow-hidden"
            style={{ background: 'conic-gradient(from 0deg, #818cf8, #c084fc, #f472b6, #fb923c, #facc15, #34d399, #818cf8)' }}
            animate={{ rotate: rotation }}
            transition={{ duration: 2, ease: [0.15, 0.85, 0.35, 1] }}
          >
            {uniqueSlugs.map((slug, i) => {
              const angle = (i / uniqueSlugs.length) * 360
              return (
                <div
                  key={slug}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <span className="text-2xl" style={{ transform: `translateY(-60px) rotate(-${angle}deg)` }}>
                    {CATEGORY_EMOJIS[slug] ?? '⭐'}
                  </span>
                </div>
              )
            })}
          </motion.div>

          {/* Center button */}
          <button
            onClick={spin}
            disabled={spinning}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white dark:bg-gray-900 shadow-xl flex items-center justify-center text-2xl font-black hover:scale-110 active:scale-95 transition-transform disabled:opacity-60 z-10 ring-2 ring-indigo-300"
          >
            {spinning ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}>
                🎰
              </motion.span>
            ) : '🎯'}
          </button>

          {/* Pointer */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-indigo-500 z-20" />
        </div>

        {/* Result */}
        <AnimatePresence>
          {showResult && result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-full max-w-xs"
            >
              <Link
                href={`/${locale}/subject/${result.id}`}
                className="block bg-card rounded-2xl shadow-lg ring-1 ring-foreground/[0.06] p-4 text-center hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full ${getCategoryColor(result.category_slug)} flex items-center justify-center`}>
                    <CategoryIcon name={result.category_icon} className="w-3.5 h-3.5 text-white" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {result.category_name[locale] ?? result.category_name['ko']}
                  </span>
                </div>
                <p className="font-bold text-foreground text-lg mb-2">
                  {result.name[locale] ?? result.name['ko']}
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                  {locale === 'ko' ? '이걸 평가하세요! →' : 'Rate this! →'}
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {!showResult && !spinning && (
          <p className="text-sm text-muted-foreground">
            {locale === 'ko' ? '룰렛을 돌려 평가할 대상을 뽑아보세요!' : 'Spin the wheel to pick a subject!'}
          </p>
        )}
      </div>
    </section>
  )
}
