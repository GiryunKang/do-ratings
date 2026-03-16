'use client'

import { useTranslations } from 'next-intl'

interface SortSelectProps {
  value: string
  onChange: (value: string) => void
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  const t = useTranslations('review')

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      <option value="latest">{t('sortLatest')}</option>
      <option value="helpful">{t('sortHelpful')}</option>
      <option value="rating">{t('sortRating')}</option>
    </select>
  )
}
