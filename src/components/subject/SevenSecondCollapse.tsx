'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface SevenSecondCollapseProps {
  subjectId: string
  previousAvg: number | null
  locale: string
}

interface CollapseEvent {
  reviewTitle: string
  newRating: number
  oldAvg: number
  newAvg: number
}

export default function SevenSecondCollapse({ subjectId, previousAvg, locale }: SevenSecondCollapseProps) {
  const [collapse, setCollapse] = useState<CollapseEvent | null>(null)
  const [phase, setPhase] = useState<'idle' | 'exploding' | 'aftermath'>('idle')
  const audioRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerCollapse = useCallback((event: CollapseEvent) => {
    setCollapse(event)
    setPhase('exploding')

    // Haptic burst
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 80, 30, 100])
    }

    // Audio: minor key shift
    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext()
      }
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      // Descending tone = score dropping
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.8)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
      osc.type = 'sine'
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 1)
    } catch {
      // Audio not available
    }

    // End after 7 seconds
    timerRef.current = setTimeout(() => {
      setPhase('aftermath')
      setTimeout(() => {
        setPhase('idle')
        setCollapse(null)
      }, 3000)
    }, 7000)
  }, [])

  // Listen for real-time review inserts
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`collapse-${subjectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `subject_id=eq.${subjectId}`,
        },
        async (payload) => {
          const newRating = Number((payload.new as { overall_rating: number }).overall_rating)

          // Check if this causes a significant drop
          if (previousAvg !== null && previousAvg - newRating >= 2) {
            // Fetch updated average
            const { data } = await supabase
              .from('subjects')
              .select('avg_rating')
              .eq('id', subjectId)
              .single()

            const newAvg = data?.avg_rating ?? previousAvg

            triggerCollapse({
              reviewTitle: (payload.new as { title: string }).title,
              newRating,
              oldAvg: previousAvg,
              newAvg: Number(newAvg),
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [subjectId, previousAvg, triggerCollapse])

  if (phase === 'idle') return null

  return (
    <AnimatePresence>
      {phase === 'exploding' && collapse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          {/* Screen shake overlay */}
          <motion.div
            animate={{
              x: [0, -3, 4, -2, 3, -1, 0],
              y: [0, 2, -3, 1, -2, 3, 0],
            }}
            transition={{ duration: 0.5, repeat: 6 }}
            className="absolute inset-0"
          >
            {/* Crack lines radiating from center */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180
                const x2 = 50 + 55 * Math.cos(rad)
                const y2 = 50 + 55 * Math.sin(rad)
                return (
                  <motion.line
                    key={i}
                    x1="50" y1="50"
                    x2={x2} y2={y2}
                    stroke="rgba(239, 68, 68, 0.4)"
                    strokeWidth="0.3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                  />
                )
              })}
            </svg>

            {/* Score drop indicator */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <div className="bg-red-500/90 backdrop-blur-md text-white rounded-2xl px-6 py-4 shadow-2xl">
                <motion.p
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-3xl font-black"
                >
                  ⚡
                </motion.p>
                <p className="text-lg font-bold mt-1">
                  ★ {collapse.oldAvg.toFixed(1)} → {collapse.newAvg.toFixed(1)}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {locale === 'ko' ? '방금 평점이 급변했습니다' : 'Rating just shifted'}
                </p>
              </div>
            </motion.div>

            {/* New review card flying in */}
            <motion.div
              initial={{ y: '100vh', rotate: 15 }}
              animate={{ y: '30vh', rotate: -3 }}
              transition={{ duration: 0.8, delay: 1, type: 'spring' }}
              className="absolute left-1/2 -translate-x-1/2 w-72"
            >
              <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-2xl ring-2 ring-red-400/50 p-4">
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < Math.round(collapse.newRating) ? 'text-red-400' : 'text-muted-foreground/20'}`}>★</span>
                  ))}
                </div>
                <p className="text-sm font-bold text-foreground truncate">&ldquo;{collapse.reviewTitle}&rdquo;</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {locale === 'ko' ? '방금 작성됨' : 'Just posted'}
                </p>
              </div>
            </motion.div>

            {/* Countdown */}
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <div className="flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-red-400"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: i + 1, duration: 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Red vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(239, 68, 68, 0.15) 100%)',
          }} />
        </motion.div>
      )}

      {phase === 'aftermath' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="fixed inset-0 z-[100] pointer-events-none"
        >
          {/* Subtle residual particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-red-400/30 rounded-full"
              style={{
                left: `${20 + i * 8}%`,
                top: `${30 + (i % 3) * 15}%`,
              }}
              animate={{ y: [0, 20], opacity: [0.3, 0] }}
              transition={{ duration: 2, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
