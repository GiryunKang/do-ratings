'use client'

import { useTheme } from './ThemeProvider'
import { useTranslations } from 'next-intl'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('darkMode')

  const options = [
    { value: 'light', label: t('light'), icon: '☀️' },
    { value: 'dark', label: t('dark'), icon: '🌙' },
    { value: 'system', label: t('system'), icon: '💻' },
  ] as const

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            theme === option.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          aria-label={option.label}
          aria-pressed={theme === option.value}
        >
          <span>{option.icon}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
