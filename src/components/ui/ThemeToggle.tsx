'use client'

import { useTheme } from './ThemeProvider'
import { useTranslations } from 'next-intl'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('darkMode')

  const options = [
    { value: 'light', label: t('light'), icon: '☀️', title: undefined },
    { value: 'dark', label: t('dark'), icon: '🌙', title: undefined },
    { value: 'system', label: null, icon: '💻', title: t('systemTitle') },
  ] as const

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-muted dark:bg-gray-800">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          title={option.title}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            theme === option.value
              ? 'bg-card dark:bg-gray-600 text-foreground dark:text-white shadow-sm'
              : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground/80 dark:hover:text-gray-200'
          }`}
          aria-label={option.label ?? option.title}
          aria-pressed={theme === option.value}
        >
          <span>{option.icon}</span>
          {option.label && <span className="hidden sm:inline">{option.label}</span>}
        </button>
      ))}
    </div>
  )
}
