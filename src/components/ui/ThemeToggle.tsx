'use client'
import { Monitor, Moon, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ui/ThemeProvider'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const ko = !usePathname().startsWith('/en')
  const options = [
    { value: 'light', icon: Sun, label: ko ? '라이트' : 'Light' },
    { value: 'dark', icon: Moon, label: ko ? '다크' : 'Dark' },
    { value: 'system', icon: Monitor, label: ko ? '시스템' : 'System' },
  ] as const
  return <fieldset className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
    <legend className="sr-only">{ko ? '색상 테마' : 'Color theme'}</legend>
    {options.map(option => <button key={option.value} type="button" aria-pressed={theme === option.value} className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-md text-[11px] ${theme === option.value ? 'bg-card font-semibold text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setTheme(option.value)}><option.icon size={15} />{option.label}</button>)}
  </fieldset>
}
