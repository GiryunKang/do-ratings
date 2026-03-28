'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

interface Category {
  id: string
  name: Record<string, string>
  slug: string
}

interface FilterState {
  category: string | null
  ratingMin: number | null
}

interface FilterPanelProps {
  categories: Category[]
  selectedCategory: string | null
  ratingMin: number | null
  onFilterChange: (filters: FilterState) => void
}

export default function FilterPanel({
  categories,
  selectedCategory,
  ratingMin,
  onFilterChange,
}: FilterPanelProps) {
  const t = useTranslations('common')
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  function getCategoryName(cat: Category): string {
    return cat.name?.[currentLocale] ?? cat.name?.ko ?? cat.name?.en ?? cat.slug
  }

  function handleCategoryClick(id: string) {
    onFilterChange({
      category: selectedCategory === id ? null : id,
      ratingMin,
    })
  }

  function handleRatingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    onFilterChange({
      category: selectedCategory,
      ratingMin: val ? parseInt(val) : null,
    })
  }

  function handleClear() {
    onFilterChange({ category: null, ratingMin: null })
  }

  const hasFilters = selectedCategory !== null || ratingMin !== null

  return (
    <aside className="w-full md:w-56 shrink-0">
      <div className="bg-card rounded-xl border border-border p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">
            {t('filter') ?? 'Filters'}
          </h3>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              {t('clearFilters') ?? 'Clear'}
            </button>
          )}
        </div>

        {/* Category filter */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('category') ?? 'Category'}
          </p>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-foreground/80 hover:bg-muted'
                  }`}
                >
                  {getCategoryName(cat)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Rating filter */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('minRating') ?? 'Min Rating'}
          </p>
          <select
            value={ratingMin ?? ''}
            onChange={handleRatingChange}
            className="w-full border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 bg-white"
          >
            <option value="">{t('any') ?? 'Any'}</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {'★'.repeat(r)} {r}+
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  )
}
