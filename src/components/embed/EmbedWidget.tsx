'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface EmbedWidgetProps {
  subjectId: string
  subjectName: string
  avgRating: number | null
  reviewCount: number
}

type SizeKey = 'sm' | 'md' | 'lg'

const SIZES: { key: SizeKey; labelKey: 'small' | 'medium' | 'large'; width: number; height: number }[] = [
  { key: 'sm', labelKey: 'small',  width: 200, height: 60  },
  { key: 'md', labelKey: 'medium', width: 300, height: 80  },
  { key: 'lg', labelKey: 'large',  width: 400, height: 120 },
]

const EMBED_DOMAIN = 'https://do-ratings.com'

function renderStars(rating: number | null): { filled: number; empty: number } {
  const rounded = Math.round(rating ?? 0)
  return { filled: Math.min(5, Math.max(0, rounded)), empty: 5 - Math.min(5, Math.max(0, rounded)) }
}

export default function EmbedWidget({ subjectId, subjectName, avgRating, reviewCount }: EmbedWidgetProps) {
  const t = useTranslations('embed')
  const [size, setSize] = useState<SizeKey>('md')
  const [copied, setCopied] = useState(false)

  const selectedSize = SIZES.find((s) => s.key === size) ?? SIZES[1]

  const iframeSrc = `${EMBED_DOMAIN}/api/embed/${subjectId}?size=${size}`
  const embedCode = `<iframe src="${iframeSrc}" width="${selectedSize.width}" height="${selectedSize.height}" frameborder="0" scrolling="no" title="${subjectName} rating badge"></iframe>`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = embedCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const { filled, empty } = renderStars(avgRating)
  const ratingDisplay = avgRating ? avgRating.toFixed(1) : '—'

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{t('embedWidget')}</h3>

      {/* Size selector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('size')}</label>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSize(s.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                size === s.key
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
              }`}
            >
              {t(s.labelKey)}
              <span className="ml-1 text-[10px] opacity-70">
                {s.width}×{s.height}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('preview')}</label>
        <div
          className="overflow-hidden"
          style={{ width: selectedSize.width, height: selectedSize.height }}
        >
          <div
            className="flex items-center gap-2 bg-card border border-border rounded-lg h-full px-3"
            style={{ width: selectedSize.width, height: selectedSize.height }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="font-semibold text-foreground truncate"
                style={{
                  fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px',
                }}
              >
                {subjectName}
              </div>
              <div
                className="flex items-center gap-1"
                style={{ fontSize: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '14px' }}
              >
                <span className="text-primary">{'★'.repeat(filled)}{'☆'.repeat(empty)}</span>
                <span className="text-foreground/80 font-medium">{ratingDisplay}</span>
              </div>
              <div
                className="text-muted-foreground"
                style={{ fontSize: size === 'sm' ? '10px' : '12px' }}
              >
                {reviewCount} reviews · Ratings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Code</label>
        <div className="relative">
          <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          <button
            onClick={() => void handleCopy()}
            className={`mt-2 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
              copied
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 border border-green-200'
                : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            {copied ? t('copied') : t('copyCode')}
          </button>
        </div>
      </div>
    </div>
  )
}
