interface Criterion {
  key: string
  ko: string
  en: string
}

interface SubRatingChartProps {
  criteria: Criterion[]
  values: Record<string, number>
  locale: string
}

export default function SubRatingChart({
  criteria,
  values,
  locale,
}: SubRatingChartProps) {
  return (
    <div className="space-y-2">
      {criteria.map((criterion) => {
        const label = locale === 'ko' ? criterion.ko : criterion.en
        const val = values[criterion.key] ?? 0
        const pct = (val / 5) * 100

        return (
          <div key={criterion.key} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-24 shrink-0 text-right truncate">
              {label}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 w-8 text-right">
              {val > 0 ? val.toFixed(1) : '-'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
