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

  useEffect(() => {
    if (!user) return

    async function generatePrediction() {
      const supabase = createClient()

      const { data: userReviews, error: userReviewsError } = await supabase
        .from('reviews')
        .select('overall_rating, subject_id')
        .eq('user_id', user!.id)
        .limit(50)
      if (userReviewsError) console.error('[RatingPrediction] user reviews query error:', userReviewsError.message)

      if (!userReviews || userReviews.length < 2) return

      const userAvg = userReviews.reduce((sum, r) => sum + Number(r.overall_rating), 0) / userReviews.length
      const reviewedIds = new Set(userReviews.map(r => r.subject_id))

      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, avg_rating, categories(slug)')
        .not('avg_rating', 'is', null)
        .limit(100)
      if (subjectsError) console.error('[RatingPrediction] subjects query error:', subjectsError.message)

      const unreviewed = (subjects ?? []).filter(s => !reviewedIds.has(s.id))
      if (unreviewed.length === 0) return

      const picked = unreviewed[Math.floor(Math.random() * unreviewed.length)]

      const subjectAvg = Number(picked.avg_rating ?? 5)
      const predicted = Math.round((userAvg * 0.6 + subjectAvg * 0.4) * 2) / 2
      const clampedPrediction = Math.max(1, Math.min(10, predicted))

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

  if (!user || !prediction) return null

  return (
    <div className="border border-border bg-card rounded-xl p-5 relative overflow-hidden">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        {locale === 'ko' ? 'AI 예측' : 'AI Prediction'}
      </h3>

      <p className="text-sm text-muted-foreground mb-3 [word-break:keep-all]">
        {locale === 'ko'
          ? '리뷰 패턴 분석 결과, 당신은 이걸...'
          : 'Based on your review pattern, you\'d rate this...'}
      </p>

      <p className="font-bold text-foreground text-base mb-3">{prediction.subjectName}</p>

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.button
            key="hidden"
            onClick={() => setRevealed(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
          >
            <span className="text-2xl font-black text-primary/20 font-mono tracking-tighter">?.?</span>
            <span className="text-xs font-semibold text-primary">
              {locale === 'ko' ? '예측 보기' : 'See prediction'}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-baseline gap-1 mb-4">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-primary font-mono"
              >
                {prediction.predictedRating.toFixed(1)}
              </motion.span>
              <span className="text-sm text-muted-foreground font-mono">/ 10</span>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/${locale}/subject/${prediction.subjectId}`}
                className="flex-1 text-center text-xs font-semibold text-white bg-primary rounded-lg py-2.5 hover:opacity-90 transition-opacity"
              >
                {locale === 'ko' ? '맞나 확인하기' : 'Prove it right'}
              </Link>
              <Link
                href={`/${locale}/subject/${prediction.subjectId}`}
                className="flex-1 text-center text-xs font-semibold text-foreground border border-border rounded-lg py-2.5 hover:bg-muted transition-colors"
              >
                {locale === 'ko' ? '틀렸어! 반박' : 'Prove it wrong'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
