'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

function AdSenseUnit({ slot }: { slot: string }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      }
    } catch {
      // adsbygoogle not loaded yet
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={adsenseClientId}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

function PlaceholderAd({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 ${className ?? ''}`}>
      <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">Ad</span>
    </div>
  )
}

export default function AdBanner() {
  const pathname = usePathname()

  // Hide on write routes
  if (pathname.includes('/write/') || pathname.endsWith('/write')) {
    return null
  }

  return (
    <>
      {/* Mobile: fixed bottom bar above BottomNav */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 h-12 overflow-hidden">
        {adsenseClientId ? (
          <AdSenseUnit slot="mobile-bottom" />
        ) : (
          <PlaceholderAd className="h-full" />
        )}
      </div>

      {/* Desktop: inline in sidebar */}
      <div className="hidden md:block mx-4 mt-4 rounded-lg overflow-hidden h-24">
        {adsenseClientId ? (
          <AdSenseUnit slot="desktop-sidebar" />
        ) : (
          <PlaceholderAd className="h-24 rounded-lg" />
        )}
      </div>
    </>
  )
}
