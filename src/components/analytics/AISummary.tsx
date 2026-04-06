'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

interface AISummaryProps {
  subjectId: string
  locale: string
}

interface Review {
  title: string
  content: string
  overall_rating: number
}

interface Summary {
  avgRating: number
  totalReviews: number
  pros: string[]
  cons: string[]
  sentiment: 'positive' | 'mixed' | 'negative'
  ratingDistribution: { rating: number; count: number }[]
}

function generateSummary(reviews: Review[]): Summary {
  const highRated = reviews.filter((r) => r.overall_rating >= 4)
  const lowRated = reviews.filter((r) => r.overall_rating <= 2)
  const avgRating = reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length

  function extractTopWords(items: Review[], count: number): string[] {
    const words: Record<string, number> = {}
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'it', 'this', 'that', 'was', 'are', 'be', 'as',
      'i', 'my', 'me', 'we', 'our', 'you', 'your', 'he', 'she', 'they',
      'very', 'so', 'not', 'no', 'yes', 'its', 'by', 'from', 'up', 'do',
      '이', '가', '을', '를', '의', '은', '는', '에', '도', '와', '과',
    ])
    items.forEach((r) => {
      const titleWords = r.title
        .split(/\s+/)
        .map((w) => w.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase())
        .filter((w) => w.length > 1 && !stopWords.has(w))
      titleWords.forEach((w) => {
        words[w] = (words[w] ?? 0) + 1
      })
    })
    return Object.entries(words)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([word]) => word)
  }

  return {
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    pros: highRated.length > 0 ? extractTopWords(highRated, 3) : [],
    cons: lowRated.length > 0 ? extractTopWords(lowRated, 3) : [],
    sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'mixed' : 'negative',
    ratingDistribution: [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: reviews.filter((rev) => Math.round(rev.overall_rating) === r).length,
    })),
  }
}

const sentimentConfig = {
  positive: { label: '😊', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800' },
  mixed: { label: '😐', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800' },
  negative: { label: '😞', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
}

export default function AISummary({ subjectId, locale }: AISummaryProps) {
  const t = useTranslations('aiSummary')
  const tAnalytics = useTranslations('analytics')

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function fetchReviews() {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews')
        .select('title, content, overall_rating')
        .eq('subject_id', subjectId)

      if (!error && data && data.length > 0) {
        setReviews(data)
        setGenerating(true)
        setTimeout(() => {
          setSummary(generateSummary(data))
          setGenerating(false)
        }, 500)
      }
      setLoading(false)
    }
    fetchReviews()
  }, [subjectId])

  const MIN_REVIEWS = 3

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">✨</span>
        <h3 className="text-sm font-semibold text-foreground/80">{t('summary')}</h3>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="h-[160px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Generating animation */}
      {!loading && generating && (
        <div className="h-[160px] flex flex-col items-center justify-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('generating')}</p>
        </div>
      )}

      {/* Not enough data */}
      {!loading && !generating && reviews.length < MIN_REVIEWS && (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-2">
            {locale === 'ko'
              ? `AI 분석을 위해 리뷰 ${MIN_REVIEWS - reviews.length}개가 더 필요합니다`
              : `${MIN_REVIEWS - reviews.length} more review${MIN_REVIEWS - reviews.length === 1 ? '' : 's'} needed for AI analysis`}
          </p>
          <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
            <div className="bg-primary rounded-full h-2" style={{ width: `${(reviews.length / MIN_REVIEWS) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Summary content */}
      {!loading && !generating && summary && reviews.length >= MIN_REVIEWS && (
        <div className="space-y-4">
          {/* Overall sentiment + avg rating */}
          <div className={`flex items-center justify-between rounded-lg px-4 py-3 border ${sentimentConfig[summary.sentiment].bg} ${sentimentConfig[summary.sentiment].border}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{sentimentConfig[summary.sentiment].label}</span>
              <span className={`text-sm font-semibold capitalize ${sentimentConfig[summary.sentiment].color}`}>
                {t('overall')}: {summary.sentiment}
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">{summary.avgRating} <span className="text-primary">★</span></div>
              <div className="text-xs text-muted-foreground">{summary.totalReviews} {t('basedOn')}</div>
            </div>
          </div>

          {/* Rating distribution */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const item = summary.ratingDistribution.find((d) => d.rating === star) ?? { rating: star, count: 0 }
              const pct = summary.totalReviews > 0 ? (item.count / summary.totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-right">{star}★</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-5 text-right">{item.count}</span>
                </div>
              )
            })}
          </div>

          {/* Pros */}
          {summary.pros.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-xs font-semibold text-green-700">{t('pros')}</span>
              </div>
              <ul className="space-y-1 pl-3.5">
                {summary.pros.map((word) => (
                  <li key={word} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-green-400">•</span> {word}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {summary.cons.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="text-xs font-semibold text-red-700">{t('cons')}</span>
              </div>
              <ul className="space-y-1 pl-3.5">
                {summary.cons.map((word) => (
                  <li key={word} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-red-400">•</span> {word}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
