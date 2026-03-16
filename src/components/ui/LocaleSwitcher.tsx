'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function LocaleSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'
  const otherLocale = currentLocale === 'ko' ? 'en' : 'ko'

  function switchLocale() {
    let newPath: string
    if (currentLocale === 'ko') {
      newPath = pathname.startsWith('/ko')
        ? '/en' + pathname.slice(3)
        : '/en' + pathname
    } else {
      newPath = '/ko' + pathname.slice(3)
    }
    router.push(newPath)
  }

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
      aria-label={`Switch to ${otherLocale.toUpperCase()}`}
    >
      <span className="text-gray-500">{currentLocale.toUpperCase()}</span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-400 hover:text-gray-600">{otherLocale.toUpperCase()}</span>
    </button>
  )
}
