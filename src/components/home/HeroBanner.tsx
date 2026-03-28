'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface HeroBannerProps {
  locale: string
}

export default function HeroBanner({ locale }: HeroBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [filledStars, setFilledStars] = useState(0)
  const [tapIndex, setTapIndex] = useState(-1)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Star tapping animation loop
  useEffect(() => {
    if (!mounted) return
    const startDelay = setTimeout(() => {
      let star = 0
      const interval = setInterval(() => {
        if (star < 5) {
          setTapIndex(star)
          setFilledStars(star + 1)
          star++
        } else {
          clearInterval(interval)
          setTapIndex(-1)
          // Reset after pause and repeat
          setTimeout(() => {
            setFilledStars(0)
            setCycle(c => c + 1)
          }, 3000)
        }
      }, 500)
      return () => clearInterval(interval)
    }, 1500)
    return () => clearTimeout(startDelay)
  }, [mounted, cycle])

  return (
    <div className="relative overflow-hidden rounded-3xl min-h-[120px] md:min-h-[200px]">
      {/* Dark mesh gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent), radial-gradient(ellipse 60% 80% at 80% 50%, rgba(255, 107, 107, 0.15), transparent), radial-gradient(ellipse 60% 80% at 20% 50%, rgba(59, 130, 246, 0.15), transparent)',
          backgroundColor: '#0c0a1a',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%)', top: '-20%', right: '-10%' }}
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%)', bottom: '-30%', left: '-5%' }}
        animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center py-4 md:py-8 px-6 gap-4 md:gap-10">

        {/* Left: Star Rating Demo Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={mounted ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3, type: 'spring' }}
          className="relative flex flex-col items-center"
        >
          {/* Stars being tapped */}
          <div className="flex gap-2 mb-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: tapIndex === i ? [1, 1.4, 1] : 1,
                  y: tapIndex === i ? [0, -6, 0] : 0,
                }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
                className="relative"
              >
                <svg
                  className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-200 ${
                    i < filledStars ? 'text-yellow-400' : 'text-white/15'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={i < filledStars ? { filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.5))' } : {}}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>

                {/* Sparkle burst when star fills */}
                {tapIndex === i && (
                  <>
                    {[0, 1, 2, 3].map((s) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 1, scale: 0 }}
                        animate={{
                          opacity: 0,
                          scale: 1,
                          x: [0, (s % 2 ? 1 : -1) * (15 + Math.random() * 10)],
                          y: [0, (s < 2 ? -1 : 1) * (12 + Math.random() * 8)],
                        }}
                        transition={{ duration: 0.5 }}
                        className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-yellow-300"
                      />
                    ))}
                  </>
                )}
              </motion.div>
            ))}
          </div>

          {/* Tapping finger cursor */}
          <motion.span
            animate={{
              x: tapIndex >= 0 ? -32 + tapIndex * 40 : 60,
              y: tapIndex >= 0 ? [0, -8, 0] : 10,
              opacity: mounted ? 1 : 0,
              rotate: tapIndex >= 0 ? -10 : 0,
            }}
            transition={{
              x: { duration: 0.3, type: 'spring', stiffness: 200 },
              y: { duration: 0.15, delay: 0.1 },
              opacity: { duration: 0.3 },
            }}
            className="text-4xl md:text-5xl select-none mt-1"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
          >
            ☝️
          </motion.span>

          {/* Completed message */}
          <motion.p
            animate={{ opacity: filledStars === 5 ? 1 : 0, y: filledStars === 5 ? 0 : 8 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-yellow-300/80 font-semibold mt-1 h-4"
          >
            {filledStars === 5 ? (locale === 'ko' ? '평가 완료! ⭐' : 'Rated! ⭐') : ''}
          </motion.p>
        </motion.div>

        {/* Right: Text content */}
        <div className="text-center md:text-left flex flex-col items-center md:items-start">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={mounted ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-3"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white/80 border border-white/10 bg-white/5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {locale === 'ko' ? '글로벌 리뷰 플랫폼' : 'Global Review Platform'}
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 100 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]"
          >
            <span>DO!</span>{' '}
            <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 bg-clip-text text-transparent">
              RATINGS!
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm md:text-base text-white/50 max-w-md mt-3 mb-5 font-medium"
          >
            {locale === 'ko'
              ? '세상 모든 것에 별점을. 당신의 한 줄이 세상을 움직인다.'
              : 'Rate everything. Your voice shapes the world.'}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href={`/${locale}/explore`}
              className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-black bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-200 hover:to-amber-300 transition-all duration-300 shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_40px_rgba(250,204,21,0.5)] hover:scale-105 active:scale-95"
            >
              <span className="group-hover:translate-x-0.5 transition-transform">⚡</span>
              {locale === 'ko' ? '지금 평가하러 가기' : 'Start Rating Now'}
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href={`/${locale}/auth/signup`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white/90 border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
            >
              {locale === 'ko' ? '무료 가입' : 'Sign up free'}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
