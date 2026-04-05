'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface RatingPredictionProps {
  locale: string
}

interface Prediction {
  subjectId: string
  subjectName: string
  predictedRating: number
  categorySlug: string
}

export default function RatingPrediction({ locale }: RatingPredictionProps) {
  const { user } = useAuth()
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [revealed, setRevealed] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching on mount */
  useEffect(() => {
    if (!user) return

    async function generatePrediction() {
      const supabase = createClient()

      const { data: userReviews } = await supabase
        .from('reviews')
        .select('overall_rating, subject_id')
        .eq('user_id', user!.id)
        .limit(50)

      if (!userReviews || userReviews.length < 2) return

      const userAvg = userReviews.reduce((sum, r) => sum + Number(r.overall_rating), 0) / userReviews.length
      const reviewedIds = new Set(userReviews.map(r => r.subject_id))

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name, avg_rating, categories(slug)')
        .not('avg_rating', 'is', null)
        .limit(100)

      const unreviewed = (subjects ?? []).filter(s => !reviewedIds.has(s.id))
      if (unreviewed.length === 0) return

      const picked = unreviewed[Math.floor(Math.random() * unreviewed.length)]

      const subjectAvg = Number(picked.avg_rating ?? 3)
      const predicted = Math.round((userAvg * 0.6 + subjectAvg * 0.4) * 2) / 2
      const clampedPrediction = Math.max(1, Math.min(5, predicted))

      const cat = Array.isArray(picked.categories) ? picked.categories[0] : picked.categories
      const nameObj = picked.name as Record<string, string>

      setPrediction({
        subjectId: picked.id,
        subjectName: nameObj[locale] ?? nameObj['ko'] ?? '',
        predictedRating: clampedPrediction,
        categorySlug: (cat?.slug ?? '') as string,
      })
    }

    generatePrediction()
  }, [user, locale])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!user || !prediction) return null

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 rounded-2xl ring-1 ring-amber-200/30 dark:ring-amber-800/30 p-5 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute -top-4 -right-4 text-6xl opacity-10 rotate-12 select-none">🤖</div>

      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        {locale === 'ko' ? 'AI 예측' : 'AI Prediction'}
      </h3>

      <p className="text-sm text-foreground/80 mb-3 [word-break:keep-all]">
        {locale === 'ko'
          ? `비슷한 리뷰 패턴을 분석한 결과, 당신은 이걸...`
          : `Based on your review pattern, you'd rate this...`}
      </p>

      <p className="font-bold text-foreground text-base mb-2">{prediction.subjectName}</p>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.button
            key="hidden"
            onClick={() => setRevealed(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-xl transition-colors"
          >
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-amber-400/30 text-sm">★</span>
              ))}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              {locale === 'ko' ? '예측 보기' : 'See prediction'}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`text-lg ${i < Math.round(prediction.predictedRating) ? 'text-amber-400' : 'text-muted-foreground/20'}`}
                  >
                    ★
                  </motion.span>
                ))}
              </span>
              <span className="text-lg font-black text-amber-500">{prediction.predictedRating.toFixed(1)}</span>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/${locale}/subject/${prediction.subjectId}`}
                className="flex-1 text-center text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-full py-2 hover:shadow-md transition-all"
              >
                {locale === 'ko' ? '맞나 확인하러 가기' : 'Prove it right'}
              </Link>
              <Link
                href={`/${locale}/subject/${prediction.subjectId}`}
                className="flex-1 text-center text-xs font-semibold text-foreground bg-card ring-1 ring-foreground/10 rounded-full py-2 hover:bg-muted transition-all"
              >
                {locale === 'ko' ? '틀렸어! 반박하기' : 'Wrong! Prove it wrong'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
