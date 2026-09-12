'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number; onChange?: (value: number) => void; readonly?: boolean;
  size?: 'sm' | 'md' | 'lg'; muted?: boolean; locale?: string; disabled?: boolean
}
const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }

export default function StarRating({ value, onChange, readonly = false, size = 'md', muted = false, locale = 'ko', disabled = false }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const displayed = hovered ?? value
  const label = value > 0 ? `${(value * 2).toFixed(1)} / 10` : locale === 'ko' ? '평점을 선택하세요' : 'Choose a rating'
  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const values: Record<string, number> = { ArrowRight: Math.min(5, (value || 0.5) + 0.5), ArrowUp: Math.min(5, (value || 0.5) + 0.5), ArrowLeft: Math.max(1, value - 0.5), ArrowDown: Math.max(1, value - 0.5), Home: 1, End: 5 }
    if (e.key in values) { e.preventDefault(); onChange?.(values[e.key]) }
  }
  return (
    <span className={`inline-flex max-w-full items-center ${readonly ? 'gap-0.5' : 'gap-0 rounded-lg'}`}
      role={readonly ? 'img' : 'slider'} aria-label={`${locale === 'ko' ? '평점' : 'Rating'}${readonly ? ` ${label}` : ''}`} aria-disabled={disabled || undefined}
      aria-valuemin={readonly ? undefined : 2} aria-valuemax={readonly ? undefined : 10}
      aria-valuenow={readonly ? undefined : Math.max(2, value * 2)} aria-valuetext={label}
      title={label} tabIndex={readonly || disabled ? undefined : 0} onKeyDown={readonly ? undefined : onKeyDown}
      onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map(star => {
        const fill = Math.max(0, Math.min(1, displayed - star + 1))
        const graphic = <span className={`relative inline-block ${sizes[size]}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" className="absolute inset-0 h-full w-full text-muted-foreground/40"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          <svg viewBox="0 0 24 24" fill="currentColor" className={`absolute inset-0 h-full w-full ${muted ? 'text-foreground/70' : 'text-primary'}`} style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </span>
        return readonly ? <span key={star}>{graphic}</span> : <button key={star} type="button" disabled={disabled} tabIndex={-1} aria-label={`${star * 2} / 10`} onClick={() => onChange?.(star)} onPointerEnter={() => setHovered(star)} onPointerLeave={() => setHovered(null)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-primary/5 active:bg-primary/10">{graphic}</button>
      })}
    </span>
  )
}
