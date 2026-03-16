'use client'

import { usePathname } from 'next/navigation'

export default function AdBanner() {
  const pathname = usePathname()

  // Hide on write routes
  if (pathname.includes('/write/') || pathname.endsWith('/write')) {
    return null
  }

  return (
    <>
      {/* Mobile: fixed bottom bar above BottomNav */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 flex items-center justify-center h-12">
        <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">
          Ad
        </span>
      </div>

      {/* Desktop: inline in sidebar — rendered by layout below categories */}
      <div className="hidden md:flex items-center justify-center bg-gray-100 rounded-lg border border-dashed border-gray-300 h-24 mx-4 mt-4">
        <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">
          Ad
        </span>
      </div>
    </>
  )
}
