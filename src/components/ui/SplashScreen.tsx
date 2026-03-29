'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const messages = [
  { ko: '당신의 솔직한 한 줄이\n세상을 바꿉니다', en: 'Your honest words\nchange the world' },
  { ko: '좋은 것은 좋다고\n나쁜 것은 나쁘다고', en: 'Good is good\nBad is bad' },
  { ko: '세상 모든 것에\n별점을', en: 'Rate everything\nin the world' },
  { ko: '한 사람의 평가가\n누군가의 더 나은 선택이 됩니다', en: 'One rating becomes\nsomeone\'s better choice' },
  { ko: '솔직한 평가가\n더 나은 세상을 만듭니다', en: 'Honest ratings\nmake a better world' },
  { ko: '당신의 경험을\n나눠주세요', en: 'Share\nyour experience' },
  { ko: '모든 목소리에는\n동등한 가치가 있습니다', en: 'Every voice\nhas equal value' },
  { ko: '평가하세요\n세상이 달라집니다', en: 'Rate it\nThe world changes' },
]

export default function SplashScreen({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(true)
  const [message] = useState(() => {
    const dayIndex = new Date().getDate() % messages.length
    return messages[dayIndex]
  })

  useEffect(() => {
    // Check if already shown in this session
    const shown = sessionStorage.getItem('splash_shown')
    if (shown) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration from sessionStorage
      setVisible(false)
      return
    }

    const timer = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('splash_shown', '1')
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const text = locale === 'ko' ? message.ko : message.en

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #4f46e5 70%, #7c3aed 85%, #db2777 100%)' }}
          onClick={() => { setVisible(false); sessionStorage.setItem('splash_shown', '1') }}
        >
          {/* Stars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
            className="flex gap-2 mb-6"
          >
            {[1, 2, 3, 4, 5].map(i => (
              <motion.svg
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                className="w-6 h-6 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.5))' }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </motion.svg>
            ))}
          </motion.div>

          {/* Logo */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="text-2xl md:text-3xl font-black text-white mb-8 tracking-tight"
          >
            DO!{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              RATINGS!
            </span>
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-lg md:text-xl text-white/80 text-center font-medium leading-relaxed whitespace-pre-line [word-break:keep-all]"
          >
            {text}
          </motion.p>

          {/* Tap to continue hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-10 text-xs text-white/30"
          >
            {locale === 'ko' ? '탭하여 계속' : 'Tap to continue'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
