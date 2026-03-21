'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { proxyImageUrl } from '@/lib/utils/image-proxy'

interface TrendingItem {
  id: string
  name: Record<string, string>
  image_url: string | null
  avg_rating: number | null
  review_count: number
  recentCount: number
}

interface TrendingSectionProps {
  locale: string
}

type Period = 'daily' | 'weekly' | 'monthly'

const periodLabels: Record<Period, { ko: string; en: string }> = {
  daily: { ko: '일간', en: 'Daily' },
  weekly: { ko: '주간', en: 'Weekly' },
  monthly: { ko: '월간', en: 'Monthly' },
}

const periodColors: Record<Period, string> = {
  daily: 'bg-red-500 text-white',
  weekly: 'bg-orange-500 text-white',
  monthly: 'bg-amber-500 text-white',
}

const periodDays: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
}

export default function TrendingSection({ locale }: TrendingSectionProps) {
  const [period, setPeriod] = useState<Period>('daily')
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true)
      const supabase = createClient()
      const since = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('reviews')
        .select('subject_id, subjects(id, name, image_url, avg_rating, review_count)')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50)

      const map = new Map<string, TrendingItem>()
      for (const r of data ?? []) {
        const s = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
        if (!s) continue
        const existing = map.get(s.id)
        if (existing) {
          existing.recentCount++
        } else {
          map.set(s.id, {
            id: s.id,
            name: s.name as Record<string, string>,
            image_url: s.image_url,
            avg_rating: s.avg_rating,
            review_count: s.review_count,
            recentCount: 1,
          })
        }
      }

      setItems([...map.values()].sort((a, b) => b.recentCount - a.recentCount).slice(0, 6))
      setLoading(false)
    }

    fetchTrending()
  }, [period])

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span>🔥</span>
          {locale === 'ko' ? '인기 Do! Ratings!' : 'Trending Do! Ratings!'}
        </h2>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                period === p
                  ? periodColors[p]
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {locale === 'ko' ? periodLabels[p].ko : periodLabels[p].en}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl ring-1 ring-foreground/10 h-32 animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, index) => {
            const name = item.name[locale] ?? item.name['ko'] ?? item.name['en'] ?? ''
            return (
              <Link key={item.id} href={`/${locale}/subject/${item.id}`}
                className="bg-card rounded-xl ring-1 ring-foreground/10 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                {item.image_url ? (
                  <div className="h-24 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proxyImageUrl(item.image_url) ?? ''} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      🔥 {index + 1}
                    </div>
                  </div>
                ) : (
                  <div className="h-16 bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center relative">
                    <span className="text-2xl">🔥</span>
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{index + 1}</span>
                  </div>
                )}
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-foreground truncate">{name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {item.avg_rating != null && <span className="text-yellow-500 font-medium">★ {item.avg_rating.toFixed(1)}</span>}
                    <span>{item.recentCount} {locale === 'ko' ? '개 리뷰' : 'reviews'}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl ring-1 ring-foreground/10 p-6 text-center">
          <p className="text-3xl mb-2">🔥</p>
          <p className="text-sm font-medium text-foreground mb-1">
            {locale === 'ko' ? '아직 이 기간의 리뷰가 없습니다' : 'No reviews for this period yet'}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {locale === 'ko' ? '첫 번째 리뷰어가 되어 트렌딩에 올라보세요!' : 'Be the first reviewer!'}
          </p>
          <Link href={`/${locale}/explore`} className="inline-flex items-center gap-1.5 h-8 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors">
            {locale === 'ko' ? '평가하러 가기' : 'Start Rating'}
          </Link>
        </div>
      )}
    </section>
  )
}
