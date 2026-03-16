'use client'

import StarRating from './StarRating'

interface Criterion {
  key: string
  ko: string
  en: string
}

interface SubRatingInputProps {
  criteria: Criterion[]
  values: Record<string, number>
  onChange: (values: Record<string, number>) => void
  locale: string
}

export default function SubRatingInput({
  criteria,
  values,
  onChange,
  locale,
}: SubRatingInputProps) {
  function handleChange(key: string, rating: number) {
    onChange({ ...values, [key]: rating })
  }

  return (
    <div className="space-y-3">
      {criteria.map((criterion) => {
        const label = locale === 'ko' ? criterion.ko : criterion.en
        const val = values[criterion.key] ?? 0

        return (
          <div key={criterion.key} className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700 w-24 shrink-0">{label}</span>
            <StarRating
              value={val}
              onChange={(rating) => handleChange(criterion.key, rating)}
              size="md"
            />
            <span className="text-sm text-gray-500 w-6 text-right">
              {val > 0 ? val.toFixed(1) : '-'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
