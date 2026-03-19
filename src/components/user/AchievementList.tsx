'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import AchievementBadge from './AchievementBadge'

interface Achievement {
  id: string
  key: string
  name: { ko: string; en: string }
  description: { ko: string; en: string }
  icon: string
  condition_type: string
  condition_value: number
}

interface AchievementListProps {
  userId: string
  locale: string
}

export default function AchievementList({ userId, locale }: AchievementListProps) {
  const t = useTranslations('achievement')
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAchievements() {
      const supabase = createClient()

      const [{ data: all }, { data: userEarned }] = await Promise.all([
        supabase.from('achievements').select('*').order('condition_value'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', userId),
      ])

      setAllAchievements((all as Achievement[]) ?? [])
      setEarnedIds(new Set((userEarned ?? []).map((r: { achievement_id: string }) => r.achievement_id)))
      setLoading(false)
    }

    fetchAchievements()
  }, [userId])

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('achievements')}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (allAchievements.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-2">{t('achievements')}</h2>
        <p className="text-sm text-gray-500">{t('noAchievements')}</p>
      </div>
    )
  }

  const earnedCount = allAchievements.filter((a) => earnedIds.has(a.id)).length
  const lang = locale === 'ko' ? 'ko' : 'en'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{t('achievements')}</h2>
        <span className="text-sm text-gray-500">
          {earnedCount}/{allAchievements.length} {t('earned')}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {allAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            icon={achievement.icon}
            name={achievement.name[lang]}
            description={achievement.description[lang]}
            earned={earnedIds.has(achievement.id)}
          />
        ))}
      </div>
    </div>
  )
}
