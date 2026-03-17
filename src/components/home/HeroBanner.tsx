'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import PointingHand from './PointingHand'

interface HeroBannerProps {
  locale: string
}

interface BurstStar {
  id: number
  x: number
  y: number
  size: number
  angle: number
  distance: number
}

export default function HeroBanner({ locale }: HeroBannerProps) {
  const [phase, setPhase] = useState(0)
  const [burstStars, setBurstStars] = useState<BurstStar[]>([])
  const [burstKey, setBurstKey] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => setPhase(3), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Generate burst stars when phase 2 hits
  useEffect(() => {
    if (phase >= 2) {
      triggerBurst()
    }
  }, [phase])

  const triggerBurst = useCallback(() => {
    const stars: BurstStar[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      size: 12 + Math.random() * 20,
      angle: (360 / 12) * i + (Math.random() * 20 - 10),
      distance: 60 + Math.random() * 100,
    }))
    setBurstStars(stars)
    setBurstKey(k => k + 1)
  }, [])

  // Recurring burst every 4 seconds
  useEffect(() => {
    if (phase < 2) return
    const interval = setInterval(triggerBurst, 4000)
    return () => clearInterval(interval)
  }, [phase, triggerBurst])

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-white min-h-[300px] md:min-h-[340px]"
      style={{
        background: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #4f46e5, #7c3aed, #db2777)',
        backgroundSize: '400% 400%',
        animation: 'heroGradientShift 8s ease infinite',
      }}
    >
      {/* Pulse rings behind the hand */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'translateX(-15%)' }}>
        {phase >= 2 && (
          <>
            <div className="absolute w-24 h-24 rounded-full border-2 border-yellow-300/20" style={{ animation: 'heroPulseRing 2.5s ease-out infinite' }} />
            <div className="absolute w-24 h-24 rounded-full border border-white/15" style={{ animation: 'heroPulseRing 2.5s ease-out infinite 0.8s' }} />
          </>
        )}
      </div>

      {/* Main layout: Hand + Text side by side */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">

        {/* Pointing Hand — realistic SVG, pointing upper-right */}
        <div className="relative flex items-center justify-center" style={{ minWidth: '160px', minHeight: '180px' }}>
          <div
            className={`w-[140px] h-[160px] md:w-[200px] md:h-[220px] lg:w-[240px] lg:h-[260px] ${phase >= 1 ? '' : 'opacity-0'}`}
            style={phase >= 1 ? {
              animation: 'heroHandPoint 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards, heroHandBob 3s ease-in-out 1.5s infinite',
            } : undefined}
          >
            <PointingHand className="w-full h-full" />
          </div>

          {/* Star bursts emanating from the fingertip (upper-right) */}
          <div className="absolute -top-8 right-0 md:-top-10 md:right-[-10px] pointer-events-none" key={burstKey}>
            {burstStars.map((star) => {
              const rad = (star.angle * Math.PI) / 180
              const bx = Math.cos(rad) * star.distance
              const by = Math.sin(rad) * star.distance
              return (
                <span
                  key={star.id}
                  className="absolute text-yellow-300"
                  style={{
                    fontSize: star.size,
                    '--burst-x': `${bx}px`,
                    '--burst-y': `${by}px`,
                    animation: `heroStarBurst 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${star.id * 0.04}s forwards`,
                    filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.8))',
                  } as React.CSSProperties}
                >
                  ★
                </span>
              )
            })}
          </div>
        </div>

        {/* Text content */}
        <div className="text-center md:text-left">
          {/* DO! RATINGS! */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none">
            <span
              className={`inline-block ${phase >= 1 ? '' : 'opacity-0'}`}
              style={phase >= 1 ? {
                animation: 'heroSlam 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              } : undefined}
            >
              DO!
            </span>
            <br className="md:hidden" />
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

          {/* Inline star rating with twinkle */}
          <div className="flex justify-center md:justify-start gap-1.5 my-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`text-2xl md:text-4xl text-yellow-300 ${phase >= 2 ? '' : 'opacity-0'}`}
                style={phase >= 2 ? {
                  animation: `heroStarExplode 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.06}s both, heroStarTwinkle 2s ease-in-out ${1.5 + i * 0.3}s infinite`,
                  filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.5))',
                } : undefined}
              >
                ★
              </span>
            ))}
          </div>

          {/* Subtitle */}
          <p
            className={`text-base md:text-lg font-medium max-w-md mb-5 transition-all duration-700 ${
              phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            {locale === 'ko'
              ? '세상 모든 것에 별점을! 당신의 한 줄이 세상을 움직인다.'
              : 'Rate everything! Your voice shapes the world.'}
          </p>

          {/* CTA Button */}
          <Link
            href={`/${locale}/explore`}
            className={`inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-extrabold px-8 py-3.5 rounded-full text-sm md:text-base shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:shadow-[0_0_50px_rgba(250,204,21,0.7)] hover:scale-110 active:scale-95 transition-all duration-300 ${
              phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            ⚡ {locale === 'ko' ? '지금 평가하러 가기' : 'Start Rating Now'}
          </Link>
        </div>
      </div>

      {/* Ambient floating stars in background */}
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '10%', left: '5%', size: '1.5rem', dur: '3s', delay: '0s' },
            { top: '20%', right: '8%', size: '1rem', dur: '2.5s', delay: '0.5s' },
            { top: '65%', left: '8%', size: '0.8rem', dur: '2.8s', delay: '1s' },
            { top: '75%', right: '12%', size: '1.2rem', dur: '3.2s', delay: '0.3s' },
            { top: '40%', right: '3%', size: '0.7rem', dur: '2.2s', delay: '1.5s' },
            { top: '85%', left: '25%', size: '0.9rem', dur: '2.6s', delay: '0.8s' },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute text-yellow-300/40"
              style={{
                top: s.top,
                left: s.left,
                right: s.right,
                fontSize: s.size,
                animation: `heroStarTwinkle ${s.dur} ease-in-out ${s.delay} infinite`,
              } as React.CSSProperties}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Shooting stars */}
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent rounded-full"
            style={{
              top: '15%', left: '20%',
              '--shoot-x': '200px', '--shoot-y': '80px',
              animation: 'heroStarShoot 1.5s linear infinite 2s',
            } as React.CSSProperties}
          />
          <div
            className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
            style={{
              top: '55%', left: '60%',
              '--shoot-x': '150px', '--shoot-y': '60px',
              animation: 'heroStarShoot 2s linear infinite 3.5s',
            } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  )
}
