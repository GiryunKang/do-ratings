'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

function Star({
  fill,
  size,
  onClickLeft,
  onClickRight,
  onHoverLeft,
  onHoverRight,
  readonly,
}: {
  fill: 'empty' | 'half' | 'full'
  size: 'sm' | 'md' | 'lg'
  onClickLeft?: () => void
  onClickRight?: () => void
  onHoverLeft?: () => void
  onHoverRight?: () => void
  readonly?: boolean
}) {
  const cls = sizeClass[size]
  const interactive = !readonly ? 'cursor-pointer' : 'cursor-default'
  const hoverScale = !readonly ? 'hover:scale-110 transition-transform duration-150' : ''

  return (
    <span className={`relative inline-block ${cls} ${interactive} ${hoverScale}`}>
      {/* Background star (gray) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={`absolute inset-0 ${cls} text-gray-300`}
        fill="currentColor"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>

      {/* Filled star overlay */}
      {fill !== 'empty' && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`absolute inset-0 ${cls} text-yellow-400 golden-glow`}
          fill="currentColor"
          style={fill === 'half' ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}

      {/* Invisible click zones */}
      {!readonly && (
        <>
          <span
            className="absolute inset-y-0 left-0 w-1/2"
            onClick={onClickLeft}
            onMouseEnter={onHoverLeft}
          />
          <span
            className="absolute inset-y-0 right-0 w-1/2"
            onClick={onClickRight}
            onMouseEnter={onHoverRight}
          />
        </>
      )}
    </span>
  )
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value

  function getFill(starIndex: number): 'empty' | 'half' | 'full' {
    const diff = displayValue - starIndex
    if (diff >= 1) return 'full'
    if (diff >= 0.5) return 'half'
    return 'empty'
  }

  return (
    <span
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHoverValue(null)}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          fill={getFill(i)}
          size={size}
          readonly={readonly}
          onClickLeft={() => onChange?.(i + 0.5)}
          onClickRight={() => onChange?.(i + 1)}
          onHoverLeft={() => setHoverValue(i + 0.5)}
          onHoverRight={() => setHoverValue(i + 1)}
        />
      ))}
    </span>
  )
}
