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

const CRITERION_TOOLTIPS: Record<string, { ko: string; en: string }> = {
  expertise: {
    ko: '해당 분야에 대한 전문 지식과 능력',
    en: 'Professional knowledge and ability in the field',
  },
  communication: {
    ko: '대중과의 소통 능력과 투명성',
    en: 'Communication ability and transparency',
  },
  reliability: {
    ko: '약속과 말에 대한 신뢰 정도',
    en: 'Trustworthiness and consistency',
  },
  value: {
    ko: '가격 대비 제공하는 가치',
    en: 'Value provided relative to cost',
  },
  quality: {
    ko: '결과물이나 서비스의 전반적인 품질',
    en: 'Overall quality of output or service',
  },
  leadership: {
    ko: '방향성 제시와 팀을 이끄는 능력',
    en: 'Ability to guide and lead effectively',
  },
  innovation: {
    ko: '새로운 아이디어와 혁신적인 접근',
    en: 'New ideas and innovative approach',
  },
  service: {
    ko: '고객 응대 및 서비스 수준',
    en: 'Customer service and support quality',
  },
}

function getTooltip(key: string, locale: string): string | undefined {
  const entry = CRITERION_TOOLTIPS[key]
  if (!entry) return undefined
  return locale === 'ko' ? entry.ko : entry.en
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
        const tooltip = getTooltip(criterion.key, locale)
        const val = values[criterion.key] ?? 0

        return (
          <div key={criterion.key} className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground/80 w-24 shrink-0">
              {label}
              {tooltip && (
                <button
                  type="button"
                  className="ml-0.5 text-muted-foreground text-xs hover:text-primary inline-flex"
                  onClick={(e) => {
                    e.preventDefault()
                    const el = e.currentTarget.nextElementSibling
                    if (el) el.classList.toggle('hidden')
                  }}
                  title={tooltip}
                >
                  ⓘ
                </button>
              )}
              {tooltip && (
                <span className="hidden text-[10px] text-muted-foreground block mt-0.5">{tooltip}</span>
              )}
            </span>
            <StarRating
              value={val}
              onChange={(rating) => handleChange(criterion.key, rating)}
              size="md"
            />
            <span className="text-sm text-muted-foreground w-6 text-right">
              {val > 0 ? val.toFixed(1) : '-'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
