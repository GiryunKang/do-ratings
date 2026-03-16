'use client'

import { useState } from 'react'

interface SortControlsProps {
  sort: string
  category: string
  categories: Array<{ slug: string; name: Record<string, string> }>
  locale: string
  onSortChange: (sort: string) => void
  onCategoryChange: (category: string) => void
}

export default function SortControls({
  sort,
  category,
  categories,
  locale,
  onSortChange,
  onCategoryChange,
}: SortControlsProps) {
  const [sortOpen, setSortOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  const sortOptions = [
    { value: 'latest', label: locale === 'ko' ? '최신순' : 'Latest' },
    { value: 'popular', label: locale === 'ko' ? '인기순' : 'Popular' },
    { value: 'topRated', label: locale === 'ko' ? '평점 높은 순' : 'Top Rated' },
  ]

  const currentSort = sortOptions.find((s) => s.value === sort) ?? sortOptions[0]
  const currentCatLabel =
    category === 'all'
      ? locale === 'ko'
        ? '전체'
        : 'All'
      : (categories.find((c) => c.slug === category)?.name[locale] ?? category)

  return (
    <div className="flex items-center gap-2 py-3 border-b border-gray-200 mb-4">
      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setSortOpen(!sortOpen)
            setCatOpen(false)
          }}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-gray-400 transition-colors"
        >
          {currentSort.label}
          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        </button>
        {sortOpen && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[140px] py-1 animate-slideDown">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSortChange(opt.value)
                  setSortOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  sort === opt.value
                    ? 'text-indigo-600 bg-indigo-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category filter dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setCatOpen(!catOpen)
            setSortOpen(false)
          }}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-gray-400 transition-colors"
        >
          {currentCatLabel}
          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
          </svg>
        </button>
        {catOpen && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[160px] py-1 animate-slideDown max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onCategoryChange('all')
                setCatOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm ${
                category === 'all'
                  ? 'text-indigo-600 bg-indigo-50 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {locale === 'ko' ? '전체' : 'All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  onCategoryChange(cat.slug)
                  setCatOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${
                  category === cat.slug
                    ? 'text-indigo-600 bg-indigo-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.name[locale] ?? cat.name['ko']}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
