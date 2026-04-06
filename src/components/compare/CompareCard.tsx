'use client'

import { proxyImageUrl } from '@/lib/utils/image-proxy'

interface CompareCardProps {
  subject: {
    id: string
    name: Record<string, string>
    image_url: string | null
    avg_rating: number | null
    review_count: number
  }
  criteria: Array<{ key: string; ko: string; en: string }>
  avgSubRatings: Record<string, number>
  highlightKeys: string[]
  locale: string
  onRemove: () => void
}

function InlineStars({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= Math.round(rating) ? 'text-primary' : 'text-muted-foreground/60'}>
        ★
      </span>
    )
  }
  return <span className="text-base leading-none">{stars}</span>
}

export default function CompareCard({
  subject,
  criteria,
  avgSubRatings,
  highlightKeys,
  locale,
  onRemove,
}: CompareCardProps) {
  const displayName = subject.name[locale] ?? subject.name['ko'] ?? Object.values(subject.name)[0] ?? ''
  const firstLetter = displayName.charAt(0).toUpperCase()

  return (
    <div className="bg-card rounded-xl border border-border p-4 relative flex flex-col gap-3 min-w-0">
      {/* Remove button */}
      <button
        onClick={onRemove}
        aria-label="Remove"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-foreground/80 text-xs font-bold transition-colors"
      >
        ✕
      </button>

      {/* Subject image or placeholder */}
      <div className="flex justify-center">
        {subject.image_url ? (
          <img
            src={proxyImageUrl(subject.image_url) ?? ''}
            alt={displayName}
            className="w-20 h-20 rounded-lg object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-foreground text-2xl font-bold select-none">
            {firstLetter}
          </div>
        )}
      </div>

      {/* Subject name */}
      <a
        href={`/${locale}/subject/${subject.id}`}
        className="text-sm font-semibold text-foreground hover:text-primary text-center leading-tight transition-colors"
      >
        {displayName}
      </a>

      {/* Overall rating */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <InlineStars rating={subject.avg_rating ?? 0} />
          <span className="text-sm font-semibold text-foreground/80 ml-1">
            {subject.avg_rating !== null ? subject.avg_rating.toFixed(1) : '—'}
          </span>
        </div>
        {/* Review count */}
        <span className="text-xs text-muted-foreground">
          {subject.review_count.toLocaleString()} reviews
        </span>
      </div>

      {/* Sub-rating bars */}
      {criteria.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {criteria.map((criterion) => {
            const value = avgSubRatings[criterion.key] ?? 0
            const widthPercent = (value / 5) * 100
            const isHighlight = highlightKeys.includes(criterion.key)
            const label = locale === 'ko' ? criterion.ko : criterion.en

            return (
              <div key={criterion.key} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="truncate pr-1">{label}</span>
                  <span className="font-medium text-foreground/80 shrink-0">
                    {value > 0 ? value.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isHighlight ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
