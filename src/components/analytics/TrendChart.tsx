'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TrendChartProps {
  subjectId: string
  locale: string
}

type Period = 'week' | 'month' | 'quarter'

interface DataPoint {
  period: string
  avgRating: number
  count: number
}

function groupByMonth(reviews: { created_at: string; overall_rating: number }[]): DataPoint[] {
  const groups: Record<string, number[]> = {}
  reviews.forEach((r) => {
    const month = r.created_at.slice(0, 7) // "2026-03"
    if (!groups[month]) groups[month] = []
    groups[month].push(Number(r.overall_rating))
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, ratings]) => ({
      period: month,
      avgRating: Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10,
      count: ratings.length,
    }))
}

function groupByWeek(reviews: { created_at: string; overall_rating: number }[]): DataPoint[] {
  const groups: Record<string, number[]> = {}
  reviews.forEach((r) => {
    const date = new Date(r.created_at)
    // ISO week: Monday-based
    const dayOfWeek = (date.getDay() + 6) % 7 // Mon=0, Sun=6
    const monday = new Date(date)
    monday.setDate(date.getDate() - dayOfWeek)
    const key = monday.toISOString().slice(0, 10) // "2026-03-16"
    if (!groups[key]) groups[key] = []
    groups[key].push(Number(r.overall_rating))
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, ratings]) => ({
      period: week,
      avgRating: Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10,
      count: ratings.length,
    }))
}

function groupByQuarter(reviews: { created_at: string; overall_rating: number }[]): DataPoint[] {
  const groups: Record<string, number[]> = {}
  reviews.forEach((r) => {
    const date = new Date(r.created_at)
    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3) + 1
    const key = `${year}-Q${quarter}`
    if (!groups[key]) groups[key] = []
    groups[key].push(Number(r.overall_rating))
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([quarter, ratings]) => ({
      period: quarter,
      avgRating: Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10,
      count: ratings.length,
    }))
}

function groupReviews(
  reviews: { created_at: string; overall_rating: number }[],
  period: Period,
): DataPoint[] {
  switch (period) {
    case 'week':
      return groupByWeek(reviews)
    case 'quarter':
      return groupByQuarter(reviews)
    case 'month':
    default:
      return groupByMonth(reviews)
  }
}

export default function TrendChart({ subjectId }: TrendChartProps) {
  const t = useTranslations('analytics')
  const [period, setPeriod] = useState<Period>('month')
  const [reviews, setReviews] = useState<{ created_at: string; overall_rating: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function fetchReviews() {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews')
        .select('created_at, overall_rating')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setReviews(data)
      }
      setLoading(false)
    }
    fetchReviews()
  }, [subjectId])

  const data = groupReviews(reviews, period)
  const hasEnoughData = data.length >= 2

  const periods: Period[] = ['week', 'month', 'quarter']

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{t('trendChart')}</h3>
        <div className="flex gap-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t(p)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasEnoughData ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
          {t('noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={(value) => [value, t('avgRating')]}
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="avgRating"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
