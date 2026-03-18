'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ReviewItem {
  id: string
  title: string
  content: string
  overall_rating: number
  helpful_count: number
  subject_id: string
  subject_name: Record<string, string>
  nickname: string
  created_at: string
}

interface PopularReviewsSectionProps {
  locale: string
}

type Period = 'daily' | 'weekly' | 'monthly'

const periodLabels: Record<Period, { ko: string; en: string }> = {
  daily: { ko: '일간', en: 'Daily' },
  weekly: { ko: '주간', en: 'Weekly' },
  monthly: { ko: '월간', en: 'Monthly' },
}

const periodDays: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
}

export default function PopularReviewsSection({ locale }: PopularReviewsSectionProps) {
  const [period, setPeriod] = useState<Period>('weekly')
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPopular() {
      setLoading(true)
      const supabase = createClient()
      const since = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('reviews')
        .select('id, title, content, overall_rating, helpful_count, created_at, subject_id, subjects(name), public_profiles(nickname)')
        .gte('created_at', since)
        .order('helpful_count', { ascending: false })
        .limit(5)

      const mapped = (data ?? []).map(r => {
        const subject = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects
        const profile = Array.isArray(r.public_profiles) ? r.public_profiles[0] : r.public_profiles
        return {
          id: r.id,
          title: r.title,
          content: r.content,
          overall_rating: r.overall_rating,
          helpful_count: r.helpful_count,
          subject_id: r.subject_id,
          subject_name: (subject?.name ?? {}) as Record<string, string>,
          nickname: (profile?.nickname as string) ?? 'Anonymous',
          created_at: r.created_at,
        }
      })

      setReviews(mapped)
      setLoading(false)
    }

    fetchPopular()
  }, [period])

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="text-lg">⭐</span>
          {locale === 'ko' ? '인기 리뷰' : 'Popular Reviews'}
        </h2>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {locale === 'ko' ? periodLabels[p].ko : periodLabels[p].en}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl ring-1 ring-foreground/10 h-20 animate-pulse" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map(review => {
            const subjectName = review.subject_name[locale] ?? review.subject_name['ko'] ?? ''
            return (
              <Link key={review.id} href={`/${locale}/subject/${review.subject_id}`}
                className="block bg-card rounded-xl ring-1 ring-foreground/10 p-4 hover:shadow-md hover:ring-primary/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{review.nickname}</span>
                      <span>·</span>
                      <span>{subjectName}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground truncate">{review.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.content}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < Math.round(review.overall_rating) ? 'text-yellow-400' : 'text-muted-foreground/30'}`}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">👍 {review.helpful_count}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl ring-1 ring-foreground/10 p-6 text-center">
          <p className="text-3xl mb-2">⭐</p>
          <p className="text-sm font-medium text-foreground mb-1">
            {locale === 'ko' ? '아직 이 기간의 인기 리뷰가 없습니다' : 'No popular reviews for this period'}
          </p>
          <p className="text-xs text-muted-foreground">
            {locale === 'ko' ? '리뷰를 작성하고 도움이 됐어요 투표를 받아보세요!' : 'Write reviews and get helpful votes!'}
          </p>
        </div>
      )}
    </section>
  )
}
