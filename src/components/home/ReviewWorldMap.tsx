'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'

interface MapReview {
  id: string
  title: string
  overall_rating: number
  subject_name: string
  nickname: string
  country_code: string
  created_at: string
}

interface ReviewWorldMapProps {
  locale: string
  initialReviews?: MapReview[]
}

interface CountryData {
  code: string
  name: string
  cx: number
  cy: number
  reviews: MapReview[]
}

const COUNTRY_POSITIONS: Record<string, { cx: number; cy: number; name_ko: string; name_en: string }> = {
  KR: { cx: 310, cy: 130, name_ko: '한국', name_en: 'South Korea' },
  JP: { cx: 325, cy: 125, name_ko: '일본', name_en: 'Japan' },
  CN: { cx: 280, cy: 125, name_ko: '중국', name_en: 'China' },
  US: { cx: 80, cy: 130, name_ko: '미국', name_en: 'United States' },
  GB: { cx: 190, cy: 100, name_ko: '영국', name_en: 'United Kingdom' },
  FR: { cx: 195, cy: 115, name_ko: '프랑스', name_en: 'France' },
  DE: { cx: 200, cy: 105, name_ko: '독일', name_en: 'Germany' },
  AU: { cx: 335, cy: 220, name_ko: '호주', name_en: 'Australia' },
  TH: { cx: 290, cy: 160, name_ko: '태국', name_en: 'Thailand' },
  SG: { cx: 295, cy: 175, name_ko: '싱가포르', name_en: 'Singapore' },
  AE: { cx: 240, cy: 150, name_ko: 'UAE', name_en: 'UAE' },
  BR: { cx: 120, cy: 200, name_ko: '브라질', name_en: 'Brazil' },
  CA: { cx: 75, cy: 95, name_ko: '캐나다', name_en: 'Canada' },
  IN: { cx: 265, cy: 155, name_ko: '인도', name_en: 'India' },
  IT: { cx: 200, cy: 120, name_ko: '이탈리아', name_en: 'Italy' },
  ES: { cx: 185, cy: 125, name_ko: '스페인', name_en: 'Spain' },
}

export default function ReviewWorldMap({ locale, initialReviews }: ReviewWorldMapProps) {
  const reviews = initialReviews ?? []
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  if (reviews.length === 0) return null

  const countryData = useMemo(() => {
    const grouped = new Map<string, MapReview[]>()
    for (const r of reviews) {
      const list = grouped.get(r.country_code) ?? []
      list.push(r)
      grouped.set(r.country_code, list)
    }

    const result: CountryData[] = []
    for (const [code, revs] of grouped) {
      const pos = COUNTRY_POSITIONS[code]
      if (!pos) continue
      result.push({
        code,
        name: locale === 'ko' ? pos.name_ko : pos.name_en,
        cx: pos.cx,
        cy: pos.cy,
        reviews: revs,
      })
    }
    return result
  }, [reviews, locale])

  const selectedData = countryData.find(c => c.code === selectedCountry)
  const maxReviews = Math.max(...countryData.map(c => c.reviews.length), 1)

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5 text-indigo-500" />
        {locale === 'ko' ? '세계 리뷰 지도' : 'World Review Map'}
      </h2>

      <div className="relative bg-gradient-to-b from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10 rounded-2xl ring-1 ring-foreground/[0.06] overflow-hidden">
        <svg viewBox="0 0 400 260" className="w-full h-auto">
          {/* Simplified world map outline */}
          <path
            d="M60,90 Q80,80 100,85 L130,80 Q150,75 170,82 L190,85 Q200,80 210,82 L220,88 Q230,85 240,90 L250,95 Q260,92 270,95 L280,100 Q290,98 300,102 L310,105 Q320,100 330,105 L340,110 Q350,108 360,115 M60,100 Q70,110 80,105 L90,110 Q100,115 110,110 L120,115 Q130,120 140,115 M170,100 Q180,105 190,102 L200,108 Q210,112 220,108 L230,115 M250,120 Q260,130 270,125 L280,130 Q290,140 300,135 L310,140 Q320,145 330,140 M60,150 Q80,160 100,155 L120,165 Q130,180 140,175 L150,185 Q140,200 130,210 M280,155 Q290,165 300,160 L310,170 Q320,180 330,175 L340,185 Q350,200 340,215 L330,220 Q320,225 310,220"
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />

          {/* Country pins */}
          {countryData.map(country => {
            const intensity = country.reviews.length / maxReviews
            const radius = 4 + intensity * 8

            return (
              <g key={country.code}>
                {/* Heatmap glow */}
                <motion.circle
                  cx={country.cx}
                  cy={country.cy}
                  r={radius * 2.5}
                  fill={`rgba(99, 102, 241, ${0.05 + intensity * 0.15})`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: (country.cx % 7) * 0.3 }}
                />

                {/* Pin */}
                <motion.circle
                  cx={country.cx}
                  cy={country.cy}
                  r={radius}
                  fill={`rgba(99, 102, 241, ${0.4 + intensity * 0.5})`}
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.5 }}
                  onClick={() => setSelectedCountry(selectedCountry === country.code ? null : country.code)}
                />

                {/* Count label */}
                <text
                  x={country.cx}
                  y={country.cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={radius > 6 ? 7 : 5}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {country.reviews.length}
                </text>
              </g>
            )
          })}

          {/* Empty state dots for countries without reviews */}
          {Object.entries(COUNTRY_POSITIONS).filter(([code]) => !countryData.find(c => c.code === code)).map(([code, pos]) => (
            <circle
              key={code}
              cx={pos.cx}
              cy={pos.cy}
              r={2}
              fill="currentColor"
              fillOpacity={0.1}
            />
          ))}
        </svg>

        {/* Selected country popup */}
        <AnimatePresence>
          {selectedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-md rounded-xl shadow-xl ring-1 ring-foreground/[0.08] p-4 max-h-40 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-foreground">
                  {selectedData.name} ({selectedData.reviews.length} {locale === 'ko' ? '리뷰' : 'reviews'})
                </h3>
                <button onClick={() => setSelectedCountry(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
              </div>
              <div className="space-y-1.5">
                {selectedData.reviews.slice(0, 5).map(review => (
                  <div key={review.id} className="flex items-center gap-2 text-xs">
                    <span className="text-yellow-500 font-medium shrink-0">{'★'.repeat(Math.round(review.overall_rating))}</span>
                    <span className="text-foreground truncate">{review.title}</span>
                    <span className="text-muted-foreground shrink-0">— {review.nickname}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats bar */}
        <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] font-medium text-muted-foreground ring-1 ring-foreground/[0.06]">
          {countryData.length} {locale === 'ko' ? '개국' : 'countries'} · {reviews.length} {locale === 'ko' ? '리뷰' : 'reviews'}
        </div>
      </div>
    </section>
  )
}
