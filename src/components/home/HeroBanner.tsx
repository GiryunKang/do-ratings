'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HeroBannerProps {
  locale: string
}

export default function HeroBanner({ locale }: HeroBannerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 md:p-10 text-white">
      {/* Floating stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Star 1 - top left, slow float */}
        <span
          className={`absolute text-4xl text-yellow-300/30 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ top: '10%', left: '5%', animation: 'heroBannerFloat 6s ease-in-out infinite' }}
        >★</span>
        {/* Star 2 - top right, medium float */}
        <span
          className={`absolute text-2xl text-yellow-300/40 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ top: '15%', right: '10%', animation: 'heroBannerFloat 4s ease-in-out infinite 1s' }}
        >★</span>
        {/* Star 3 - bottom left */}
        <span
          className={`absolute text-3xl text-yellow-300/20 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ bottom: '15%', left: '15%', animation: 'heroBannerFloat 5s ease-in-out infinite 0.5s' }}
        >★</span>
        {/* Star 4 - center right */}
        <span
          className={`absolute text-xl text-white/20 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ top: '40%', right: '5%', animation: 'heroBannerFloat 7s ease-in-out infinite 2s' }}
        >★</span>
        {/* Star 5 - bottom right */}
        <span
          className={`absolute text-5xl text-yellow-300/15 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ bottom: '5%', right: '20%', animation: 'heroBannerFloat 5.5s ease-in-out infinite 1.5s' }}
        >★</span>
        {/* Sparkle dots */}
        <span className="absolute w-2 h-2 bg-white/20 rounded-full" style={{ top: '25%', left: '30%', animation: 'pulse 2s ease-in-out infinite' }} />
        <span className="absolute w-1.5 h-1.5 bg-white/30 rounded-full" style={{ top: '60%', right: '30%', animation: 'pulse 3s ease-in-out infinite 1s' }} />
        <span className="absolute w-1 h-1 bg-yellow-300/40 rounded-full" style={{ top: '45%', left: '60%', animation: 'pulse 2.5s ease-in-out infinite 0.5s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Do! Ratings! text with animation */}
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1">
            <span className="inline-block" style={{ animation: 'heroBannerBounceIn 0.6s ease-out' }}>Do!</span>
            {' '}
            <span className="inline-block text-yellow-300" style={{ animation: 'heroBannerBounceIn 0.6s ease-out 0.2s both' }}>Ratings!</span>
          </h1>
          {/* Star rating animation */}
          <div className={`flex justify-center gap-1 my-3 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="text-2xl md:text-3xl text-yellow-300"
                style={{ animation: `heroBannerStarPop 0.4s ease-out ${0.6 + i * 0.1}s both` }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Subtitle */}
        <p className={`text-base md:text-lg text-white/80 mb-5 max-w-md mx-auto transition-all duration-500 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {locale === 'ko'
            ? '세상 모든 것에 별점을 매기자! 당신의 평가가 세상을 바꿉니다.'
            : 'Rate everything in the world! Your ratings make a difference.'}
        </p>

        {/* CTA Button */}
        <Link
          href={`/${locale}/explore`}
          className={`inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-3 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm md:text-base delay-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span>🌟</span>
          {locale === 'ko' ? '지금 평가하기' : 'Start Rating'}
        </Link>
      </div>
    </div>
  )
}
