'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Target, Check } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface DailyMissionProps {
  locale: string
}

const MISSIONS = [
  { categorySlug: 'airlines', ko: '항공사 1개 평가하기', en: 'Rate 1 airline' },
  { categorySlug: 'restaurants', ko: '맛집 1개 평가하기', en: 'Rate 1 restaurant' },
  { categorySlug: 'hotels', ko: '호텔 1개 평가하기', en: 'Rate 1 hotel' },
  { categorySlug: 'people', ko: '인물 1명 평가하기', en: 'Rate 1 person' },
  { categorySlug: 'companies', ko: '기업 1개 평가하기', en: 'Rate 1 company' },
  { categorySlug: 'places', ko: '장소 1개 평가하기', en: 'Rate 1 place' },
]

export default function DailyMission({ locale }: DailyMissionProps) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState(false)
  const [checking, setChecking] = useState(true)

  // Deterministic daily mission based on date
  const todayMission = useMemo(() => {
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    return MISSIONS[seed % MISSIONS.length]
  }, [])

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    async function checkCompletion() {
      const supabase = createClient()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      // Check if user has reviewed any subject in the mission category today
      const { data: todayReviews, error } = await supabase
        .from('reviews')
        .select('id, subjects!inner(categories!inner(slug))')
        .eq('user_id', user!.id)
        .gte('created_at', todayStart.toISOString())
        .limit(50)
      if (error) console.error('[DailyMission] query error:', error.message)

      const hasCompleted = (todayReviews ?? []).some(r => {
        const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
        const cat = subject?.categories
        const catObj = Array.isArray(cat) ? cat[0] : cat
        return (catObj as { slug: string } | null)?.slug === todayMission.categorySlug
      })

      setCompleted(hasCompleted)
      setChecking(false)
    }

    checkCompletion()
  }, [user, todayMission.categorySlug])

  if (checking) return null

  return (
    <div className={`border rounded-xl p-4 transition-all ${completed ? 'bg-emerald-50 border-emerald-200' : 'bg-card border-border'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-100' : 'bg-primary/10'}`}>
          {completed ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
              <Check className="w-5 h-5 text-emerald-600" />
            </motion.div>
          ) : (
            <Target className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            {locale === 'ko' ? '오늘의 미션' : "Today's Mission"}
          </p>
          <p className={`text-sm font-bold ${completed ? 'text-emerald-700 line-through' : 'text-foreground'}`}>
            {locale === 'ko' ? todayMission.ko : todayMission.en}
          </p>
        </div>
        {completed ? (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
            {locale === 'ko' ? '완료!' : 'Done!'}
          </span>
        ) : (
          <Link
            href={`/${locale}/explore?category=${todayMission.categorySlug}`}
            className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
          >
            {locale === 'ko' ? '도전' : 'Go'}
          </Link>
        )}
      </div>
    </div>
  )
}
