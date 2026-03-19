'use client'

import { usePathname } from 'next/navigation'

interface TrustBadgeProps {
  score: number  // 0-100
  size?: 'sm' | 'md'  // default 'sm'
}

function getColorClasses(score: number) {
  if (score <= 30) {
    return { text: 'text-gray-400', dot: 'bg-gray-400', bar: 'bg-gray-400' }
  } else if (score <= 60) {
    return { text: 'text-primary', dot: 'bg-primary', bar: 'bg-primary' }
  } else if (score <= 80) {
    return { text: 'text-green-500', dot: 'bg-green-500', bar: 'bg-green-500' }
  } else {
    return { text: 'text-amber-500', dot: 'bg-amber-500', bar: 'bg-amber-500' }
  }
}

export default function TrustBadge({ score, size = 'sm' }: TrustBadgeProps) {
  const pathname = usePathname()
  const locale = pathname?.startsWith('/en') ? 'en' : 'ko'
  const clampedScore = Math.min(100, Math.max(0, score))
  const colors = getColorClasses(clampedScore)

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {clampedScore}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{locale === 'ko' ? '신뢰 점수:' : 'Trust Score:'}</span>
        <span className={`text-sm font-semibold ${colors.text}`}>{clampedScore}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  )
}
