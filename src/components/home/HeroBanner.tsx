'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="relative overflow-hidden rounded-3xl min-h-[180px] md:min-h-[220px]">
      {/* Animated mesh gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent), radial-gradient(ellipse 60% 80% at 80% 50%, rgba(255, 107, 107, 0.15), transparent), radial-gradient(ellipse 60% 80% at 20% 50%, rgba(59, 130, 246, 0.15), transparent)',
          backgroundColor: '#0c0a1a',
        }}
      />

      {/* Animated grid pattern */}
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
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center py-8 md:py-12 px-6 gap-6 md:gap-10">
        {/* Pointing Hand — animated */}
        <motion.div
          initial={{ opacity: 0, x: -60, rotate: -20 }}
          animate={mounted ? { opacity: 1, x: 0, rotate: -25 } : {}}
          transition={{ duration: 0.7, delay: 0.3, type: 'spring', stiffness: 120 }}
          className="hidden md:block shrink-0"
        >
          <motion.span
            animate={{ y: [0, -8, 0], rotate: [-25, -22, -25] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="block text-[100px] lg:text-[130px] select-none"
            style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))' }}
          >
            👉
          </motion.span>
        </motion.div>

        {/* Text content */}
        <div className="text-center md:text-left flex flex-col items-center md:items-start">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={mounted ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4"
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

        {/* Stars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={mounted ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
          className="flex gap-1 my-3"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={mounted ? { opacity: 1, rotateY: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4, type: 'spring' }}
              className="text-xl md:text-2xl text-yellow-400"
              style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.4))' }}
            >
              ★
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-sm md:text-base text-white/60 max-w-md mb-5 font-medium"
        >
          {locale === 'ko'
            ? '세상 모든 것에 별점을. 당신의 한 줄이 세상을 움직인다.'
            : 'Rate everything. Your voice shapes the world.'}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
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
        </motion.div>

        </div>{/* end text content */}

        {/* Mobile hand — smaller, below text */}
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={mounted ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6, type: 'spring' }}
          className="md:hidden text-6xl select-none"
          style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }}
        >
          👉
        </motion.span>
      </div>
    </div>
  )
}
