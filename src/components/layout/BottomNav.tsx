'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useRef } from 'react'
import { Home, BarChart2, Search, FileText, User } from 'lucide-react'

const tabs = [
  {
    key: 'home',
    href: '',
    icon: <Home className="w-6 h-6" strokeWidth={1.8} />,
  },
  {
    key: 'rankings',
    href: '/rankings',
    icon: <BarChart2 className="w-6 h-6" strokeWidth={1.8} />,
  },
  {
    key: 'explore',
    href: '/explore',
    icon: <Search className="w-6 h-6" strokeWidth={1.8} />,
  },
  {
    key: 'feed',
    href: '/feed',
    icon: <FileText className="w-6 h-6" strokeWidth={1.8} />,
  },
  {
    key: 'profile',
    href: '/profile',
    icon: <User className="w-6 h-6" strokeWidth={1.8} />,
  },
]

export default function BottomNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number; tabKey: string } | null>(null)
  const rippleIdRef = useRef(0)

  // Detect locale prefix
  const localeMatch = pathname.match(/^\/(ko|en)/)
  const locale = localeMatch ? localeMatch[1] : 'ko'
  const basePath = `/${locale}`

  function handleRipple(e: React.MouseEvent, tabKey: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    rippleIdRef.current += 1
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleIdRef.current, tabKey })
    setTimeout(() => setRipple(null), 600)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const href = basePath + tab.href
          const isActive =
            tab.href === ''
              ? pathname === basePath || pathname === basePath + '/'
              : pathname.startsWith(basePath + tab.href)

          return (
            <Link
              key={tab.key}
              href={href}
              onClick={(e) => handleRipple(e, tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors duration-150 relative overflow-hidden ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {ripple && ripple.tabKey === tab.key && (
                <span
                  style={{
                    position: 'absolute',
                    left: ripple.x - 20,
                    top: ripple.y - 20,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                    animation: 'ripple 0.6s ease-out forwards',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <span className={isActive ? 'transform scale-110 transition-transform duration-150' : ''}>
                {tab.icon}
              </span>
              <span>{t(tab.key as 'home' | 'explore' | 'rankings' | 'feed' | 'profile')}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-scaleIn" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
