'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface FaultlineFeedProps {
  subjectId: string
  locale: string
}

interface HiddenReview {
  id: string
  title: string
  overall_rating: number
  nickname: string
}

export default function FaultlineFeed({ subjectId, locale }: FaultlineFeedProps) {
  const [polarization, setPolarization] = useState(0)
  const [crackRevealed, setCrackRevealed] = useState(false)
  const [hiddenReviews, setHiddenReviews] = useState<HiddenReview[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching */
  useEffect(() => {
    async function analyze() {
      const supabase = createClient()

      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, title, overall_rating, public_profiles(nickname)')
        .eq('subject_id', subjectId)
        .eq('is_deleted', false)
        .order('overall_rating', { ascending: true })
        .limit(50)
      if (reviewsError) console.error('[FaultlineFeed] reviews query error:', reviewsError.message)

      if (!reviews || reviews.length < 4) return

      const ratings = reviews.map(r => Number(r.overall_rating))
      const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length
      const variance = ratings.reduce((sum, r) => sum + (r - mean) ** 2, 0) / ratings.length
      const stdDev = Math.sqrt(variance)

      // Polarization score: high when std dev is high AND there are extremes
      const extremeHigh = ratings.filter(r => r >= 4.5).length
      const extremeLow = ratings.filter(r => r <= 2).length
      const polarScore = Math.min(1, (stdDev / 2) * Math.min(extremeHigh, extremeLow) / 2)

      if (polarScore < 0.3) return

      setPolarization(polarScore)
      setShakeIntensity(polarScore * 2)

      // Hidden reviews = the most extreme ones
      const extreme = reviews.filter(r => {
        const rating = Number(r.overall_rating)
        return rating <= 1.5 || rating >= 4.5
      }).slice(0, 4)

      setHiddenReviews(extreme.map(r => {
        const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
        return {
          id: r.id,
          title: r.title,
          overall_rating: r.overall_rating,
          nickname: (profile?.nickname as string) ?? 'Anonymous',
        }
      }))
    }

    analyze()
  }, [subjectId])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (shakeIntensity <= 0 || !containerRef.current) return

    let frame: number
    function shake() {
      if (!containerRef.current) return
      const x = (Math.random() - 0.5) * shakeIntensity
      const y = (Math.random() - 0.5) * shakeIntensity * 0.5
      containerRef.current.style.transform = `translate(${x}px, ${y}px)`
      frame = requestAnimationFrame(shake)
    }

    frame = requestAnimationFrame(shake)
    return () => cancelAnimationFrame(frame)
  }, [shakeIntensity])

  // Trigger haptic on scroll
  useEffect(() => {
    if (polarization < 0.3) return

    function onScroll() {
      if (navigator.vibrate && Math.random() < polarization * 0.15) {
        navigator.vibrate(15)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [polarization])

  if (polarization < 0.3) return null

  return (
    <div ref={containerRef} className="relative my-4">
      {/* Faultline crack */}
      <button
        type="button"
        onClick={() => {
          setCrackRevealed(!crackRevealed)
          if (navigator.vibrate) navigator.vibrate([30, 20, 50])
        }}
        className="w-full group relative"
      >
        <div className="relative h-12 flex items-center justify-center overflow-hidden">
          {/* Crack line */}
          <svg viewBox="0 0 400 40" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
            <motion.path
              d="M0,20 L40,18 L80,22 L120,17 L145,25 L160,15 L180,23 L200,20 L220,16 L240,24 L260,18 L280,22 L300,15 L320,25 L340,19 L360,23 L400,20"
              stroke="currentColor"
              strokeOpacity={0.15 + polarization * 0.3}
              strokeWidth={1 + polarization * 2}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          </svg>

          {/* Glow along crack */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(239, 68, 68, ${polarization * 0.1}), transparent)`,
              filter: `blur(${4 + polarization * 8}px)`,
            }}
          />

          {/* Label */}
          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative z-10 text-xs font-medium text-red-400/60 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {locale === 'ko' ? '의견 충돌 감지 — 탭하여 보기' : 'Opinion conflict — tap to reveal'}
          </motion.span>
        </div>
      </button>

      {/* Revealed reviews */}
      <AnimatePresence>
        {crackRevealed && hiddenReviews.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="overflow-hidden"
          >
            <div className="py-3 space-y-2">
              <p className="text-xs font-bold text-red-400/80 text-center mb-2">
                ⚡ {locale === 'ko' ? '극단적 의견들' : 'Extreme Opinions'}
              </p>
              {hiddenReviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ x: i % 2 === 0 ? -50 : 50, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                  className={`rounded-xl p-3 ring-1 ${
                    review.overall_rating >= 4
                      ? 'bg-green-50 dark:bg-green-950/20 ring-green-200/30'
                      : 'bg-red-50 dark:bg-red-950/20 ring-red-200/30'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className={review.overall_rating >= 4 ? 'text-green-500' : 'text-red-500'}>
                      {'★'.repeat(Math.round(review.overall_rating))}{'☆'.repeat(5 - Math.round(review.overall_rating))}
                    </span>
                    <span className="font-bold text-foreground truncate">{review.title}</span>
                    <span className="text-muted-foreground shrink-0">— {review.nickname}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
