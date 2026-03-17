'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HeroBannerProps {
  locale: string
}

export default function HeroBanner({ locale }: HeroBannerProps) {
  const [phase, setPhase] = useState(0) // 0=hidden, 1=slam, 2=stars, 3=content

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 700)
    const t3 = setTimeout(() => setPhase(3), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-10 md:p-14 text-white min-h-[280px] md:min-h-[320px]"
      style={{
        background: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #6366f1, #8b5cf6, #ec4899)',
        backgroundSize: '400% 400%',
        animation: 'heroGradientShift 8s ease infinite',
      }}
    >
      {/* Pulse rings from center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {phase >= 1 && (
          <>
            <div className="absolute w-32 h-32 rounded-full border-2 border-white/20" style={{ animation: 'heroPulseRing 2s ease-out infinite' }} />
            <div className="absolute w-32 h-32 rounded-full border-2 border-yellow-300/20" style={{ animation: 'heroPulseRing 2s ease-out infinite 0.5s' }} />
            <div className="absolute w-32 h-32 rounded-full border border-white/10" style={{ animation: 'heroPulseRing 2s ease-out infinite 1s' }} />
          </>
        )}
      </div>

      {/* Orbiting stars */}
      {phase >= 2 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[
            { size: 'text-3xl', radius: '120px', duration: '8s', delay: '0s', color: 'text-yellow-300' },
            { size: 'text-2xl', radius: '100px', duration: '6s', delay: '1s', color: 'text-yellow-400' },
            { size: 'text-xl', radius: '140px', duration: '10s', delay: '2s', color: 'text-amber-300' },
            { size: 'text-4xl', radius: '90px', duration: '12s', delay: '0.5s', color: 'text-yellow-200' },
            { size: 'text-lg', radius: '160px', duration: '7s', delay: '1.5s', color: 'text-orange-300' },
          ].map((star, i) => (
            <span
              key={i}
              className={`absolute ${star.size} ${star.color}`}
              style={{
                '--orbit-radius': star.radius,
                animation: `heroOrbit ${star.duration} linear infinite ${star.delay}`,
              } as React.CSSProperties}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Meteor streaks */}
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-24 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ top: '20%', left: '10%', animation: 'heroMeteor 3s linear infinite 0s' }} />
          <div className="absolute w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-300/50 to-transparent" style={{ top: '50%', left: '30%', animation: 'heroMeteor 4s linear infinite 1.5s' }} />
          <div className="absolute w-20 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ top: '70%', left: '60%', animation: 'heroMeteor 3.5s linear infinite 2.5s' }} />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* DO! */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
          <span
            className={`inline-block ${phase >= 1 ? '' : 'opacity-0'}`}
            style={phase >= 1 ? {
              animation: 'heroSlam 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards, heroShake 4s ease-in-out 1.5s infinite',
            } : undefined}
          >
            DO!
          </span>
          {' '}
          <span
            className={`inline-block ${phase >= 1 ? '' : 'opacity-0'}`}
            style={phase >= 1 ? {
              animation: 'heroSlam 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both, heroGlow 3s ease-in-out 1s infinite',
              color: '#facc15',
            } : undefined}
          >
            RATINGS!
          </span>
        </h1>

        {/* Exploding stars row */}
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`text-3xl md:text-5xl text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] ${phase >= 2 ? '' : 'opacity-0'}`}
              style={phase >= 2 ? {
                animation: `heroStarExplode 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s both`,
              } : undefined}
            >
              ★
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <p
          className={`text-lg md:text-xl font-medium max-w-lg mx-auto mb-6 transition-all duration-700 ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
        >
          {locale === 'ko'
            ? '세상 모든 것에 별점을! 당신의 한 줄이 세상을 움직인다.'
            : 'Rate everything! Your voice shapes the world.'}
        </p>

        {/* CTA Button */}
        <Link
          href={`/${locale}/explore`}
          className={`inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-extrabold px-10 py-4 rounded-full text-base md:text-lg shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:shadow-[0_0_50px_rgba(250,204,21,0.7)] hover:scale-110 active:scale-95 transition-all duration-300 ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          ⚡ {locale === 'ko' ? '지금 평가하러 가기' : 'Start Rating Now'}
        </Link>
      </div>
    </div>
  )
}
