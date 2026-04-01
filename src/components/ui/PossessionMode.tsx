'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PossessionModeProps {
  locale: string
}

type PossessionEvent = 'cursor-dodge' | 'whisper' | 'star-hesitate' | 'scroll-interrupt'

const WHISPERS_KO = [
  '...무시하시려고요?',
  '...정말요?',
  '...한 번 더 생각해보세요',
  '...그래도 괜찮겠어요?',
]

const WHISPERS_EN = [
  '...ignoring this?',
  '...really?',
  '...think again',
  '...are you sure?',
]

export default function PossessionMode({ locale }: PossessionModeProps) {
  const [activeEvent, setActiveEvent] = useState<PossessionEvent | null>(null)
  const [whisperText, setWhisperText] = useState('')
  const [whisperPos, setWhisperPos] = useState({ x: 0, y: 0 })
  const scrollCountRef = useRef(0)
  const lastTriggerRef = useRef(0)
  const audioRef = useRef<AudioContext | null>(null)
  const sessionTriggeredRef = useRef(false)

  const canTrigger = useCallback(() => {
    // Max 1 trigger per session, and cooldown of 60s minimum
    if (sessionTriggeredRef.current) return false
    const now = Date.now()
    if (now - lastTriggerRef.current < 60000) return false
    return true
  }, [])

  const playWhisper = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext()
      }
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const panner = ctx.createStereoPanner()

      osc.connect(gain)
      gain.connect(panner)
      panner.connect(ctx.destination)

      // Whisper from one side only
      panner.pan.value = Math.random() > 0.5 ? -0.9 : 0.9

      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.5)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.8)
    } catch {
      // Audio not available
    }
  }, [])

  // Fast scroll detection — when user rapidly scrolls past reviews
  useEffect(() => {
    let lastScrollY = window.scrollY
    let rapidScrollCount = 0

    function onScroll() {
      const delta = Math.abs(window.scrollY - lastScrollY)
      lastScrollY = window.scrollY

      if (delta > 100) {
        rapidScrollCount++
      } else {
        rapidScrollCount = Math.max(0, rapidScrollCount - 1)
      }

      // Trigger if user is speed-scrolling aggressively
      if (rapidScrollCount >= 8 && canTrigger() && Math.random() < 0.3) {
        const whispers = locale === 'ko' ? WHISPERS_KO : WHISPERS_EN
        setWhisperText(whispers[scrollCountRef.current % whispers.length])
        setWhisperPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
        setActiveEvent('scroll-interrupt')
        scrollCountRef.current++
        lastTriggerRef.current = Date.now()
        sessionTriggeredRef.current = true

        playWhisper()

        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10])
        }

        setTimeout(() => setActiveEvent(null), 2000)
        rapidScrollCount = 0
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [locale, canTrigger, playWhisper])

  // Cursor dodge — buttons that slightly move away from cursor
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!canTrigger()) return

      // Find interactive elements near cursor
      const elements = document.querySelectorAll('a[href], button')
      for (const el of elements) {
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2)

        // Only trigger on very close hover, very rarely
        if (dist < 30 && Math.random() < 0.002) {
          const htmlEl = el as HTMLElement
          const dx = (cx - e.clientX) * 0.3
          const dy = (cy - e.clientY) * 0.3

          htmlEl.style.transition = 'transform 0.2s ease-out'
          htmlEl.style.transform = `translate(${dx}px, ${dy}px)`

          lastTriggerRef.current = Date.now()
          sessionTriggeredRef.current = true

          setTimeout(() => {
            htmlEl.style.transform = ''
          }, 400)

          setActiveEvent('cursor-dodge')
          setTimeout(() => setActiveEvent(null), 1000)
          break
        }
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [canTrigger])

  return (
    <AnimatePresence>
      {activeEvent === 'scroll-interrupt' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[200] pointer-events-none"
          style={{ left: whisperPos.x, top: whisperPos.y, transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 2 }}
            className="bg-black/80 backdrop-blur-md text-white/80 px-5 py-2.5 rounded-full text-sm font-medium shadow-2xl"
          >
            {whisperText}
          </motion.div>
        </motion.div>
      )}

      {activeEvent === 'cursor-dodge' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 right-4 z-[200] pointer-events-none"
        >
          <motion.span
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.5 }}
            className="text-xs text-muted-foreground/50 italic"
          >
            {locale === 'ko' ? '...?' : '...?'}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
