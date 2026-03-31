'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface SentimentRiverProps {
  subjectId: string
  locale: string
}

interface DataPoint {
  date: string
  avgRating: number
  count: number
}

export default function SentimentRiver({ subjectId, locale }: SentimentRiverProps) {
  const [data, setData] = useState<DataPoint[]>([])

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching on mount */
  useEffect(() => {
    async function fetchSentiment() {
      const supabase = createClient()

      const { data: reviews } = await supabase
        .from('reviews')
        .select('overall_rating, created_at')
        .eq('subject_id', subjectId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200)

      if (!reviews || reviews.length === 0) return

      const grouped = new Map<string, { sum: number; count: number }>()
      for (const r of reviews) {
        const date = r.created_at.slice(0, 7)
        const entry = grouped.get(date) ?? { sum: 0, count: 0 }
        entry.sum += Number(r.overall_rating)
        entry.count++
        grouped.set(date, entry)
      }

      const points: DataPoint[] = [...grouped.entries()].map(([date, { sum, count }]) => ({
        date,
        avgRating: sum / count,
        count,
      }))

      setData(points)
    }

    fetchSentiment()
  }, [subjectId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const { pathD, areaD, points, minRating, maxRating, moodColor, moodLabel } = useMemo(() => {
    if (data.length < 2) return { pathD: '', areaD: '', points: [], minRating: 0, maxRating: 5, moodColor: '', moodLabel: '' }

    const width = 400
    const height = 100
    const padding = 10

    const ratings = data.map(d => d.avgRating)
    const min = Math.max(0, Math.min(...ratings) - 0.5)
    const max = Math.min(5, Math.max(...ratings) + 0.5)

    const pts = data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * (width - 2 * padding),
      y: padding + (1 - (d.avgRating - min) / (max - min)) * (height - 2 * padding),
      ...d,
    }))

    let d = `M${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2
      d += ` C${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`
    }

    const areaPath = `${d} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`

    const latestAvg = data[data.length - 1].avgRating
    let color = '#34d399'
    let label = locale === 'ko' ? '☀️ 맑음' : '☀️ Clear'
    if (latestAvg < 2.5) {
      color = '#f87171'
      label = locale === 'ko' ? '🌧️ 폭풍' : '🌧️ Stormy'
    } else if (latestAvg < 3.5) {
      color = '#fbbf24'
      label = locale === 'ko' ? '⛅ 흐림' : '⛅ Cloudy'
    } else if (latestAvg < 4.0) {
      color = '#60a5fa'
      label = locale === 'ko' ? '🌤️ 대체로 맑음' : '🌤️ Mostly Clear'
    }

    return { pathD: d, areaD: areaPath, points: pts, minRating: min, maxRating: max, moodColor: color, moodLabel: label }
  }, [data, locale])

  if (data.length < 2) return null

  return (
    <div className="bg-card rounded-xl ring-1 ring-foreground/[0.06] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>🌊</span>
          {locale === 'ko' ? '감정 날씨' : 'Sentiment Weather'}
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${moodColor}20`, color: moodColor }}>
          {moodLabel}
        </span>
      </div>

      <svg viewBox="0 0 400 100" className="w-full h-24" preserveAspectRatio="none">
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map(rating => {
          if (rating < minRating || rating > maxRating) return null
          const y = 10 + (1 - (rating - minRating) / (maxRating - minRating)) * 80
          return (
            <line key={rating} x1="10" y1={y} x2="390" y2={y} stroke="currentColor" strokeOpacity={0.06} strokeDasharray="4 4" />
          )
        })}

        {/* Area fill */}
        <motion.path
          d={areaD}
          fill={moodColor}
          fillOpacity={0.1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={moodColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Data points */}
        {points.map((pt, i) => (
          <motion.circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={moodColor}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <title>{`${pt.date}: ★${pt.avgRating.toFixed(1)} (${pt.count} ${locale === 'ko' ? '리뷰' : 'reviews'})`}</title>
          </motion.circle>
        ))}
      </svg>

      {/* Date labels */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  )
}
