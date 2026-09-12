'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  const applyTheme = (resolved: 'light' | 'dark') => {
    setResolvedTheme(resolved)
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    try { localStorage.setItem('ratings-theme', newTheme) } catch { /* The preference still works for this visit. */ }

    if (newTheme === 'dark') {
      applyTheme('dark')
    } else if (newTheme === 'light') {
      applyTheme('light')
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(systemDark ? 'dark' : 'light')
    }
  }

  useEffect(() => {
    let stored: string | null = null
    try { stored = localStorage.getItem('ratings-theme') } catch { /* Storage can be unavailable in private contexts. */ }
    const initial: Theme = stored === 'light' || stored === 'dark' ? stored : 'system'
    // Hydration: sync client state from localStorage (only runs once on mount)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from localStorage
    setThemeState(initial)

    if (initial === 'dark') {
      applyTheme('dark')
    } else if (initial === 'light') {
      applyTheme('light')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      applyTheme(e.matches ? 'dark' : 'light')
    }

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
