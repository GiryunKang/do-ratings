'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Shuffle, ArrowRight } from 'lucide-react'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface RouletteSubject {
  id: string
  name: Record<string, string>
  category_slug: string
  category_icon: string
  category_name: Record<string, string>
  image_url: string | null
}

interface RatingRouletteProps {
  subjects: RouletteSubject[]
  locale: string
}

export default function RatingRoulette({ subjects, locale }: RatingRouletteProps) {
  const [result, setResult] = useState<RouletteSubject | null>(null)
  const [picking, setPicking] = useState(false)
  const [preview, setPreview] = useState<RouletteSubject | null>(null)
  const [revealed, setRevealed] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)

  function playTickSound() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { /* ignore */ })
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } catch { /* audio unavailable */ }
  }

  function playDingSound() {
    try {
      if (!audioRef.current) audioRef.current = new AudioContext()
      const ctx = audioRef.current
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { /* ignore */ })
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* audio unavailable */ }
  }

  const pickRandom = useCallback(() => {
    if (picking || subjects.length === 0) return
    setPicking(true)
    setRevealed(false)
    setResult(null)

    let speed = 60
    let count = 0
    const totalSteps = 15

    function tick() {
      setPreview(subjects[Math.floor(Math.random() * subjects.length)])
      playTickSound()
      count++

      if (count >= totalSteps) {
        const final = subjects[Math.floor(Math.random() * subjects.length)]
        setPreview(final)
        setResult(final)
        setPicking(false)
        setTimeout(() => {
          setRevealed(true)
          playDingSound()
          navigator.vibrate?.([50, 30, 100])
        }, 100)
        return
      }

      speed += 20
      intervalRef.current = setTimeout(tick, speed)
    }

    tick()
  }, [picking, subjects])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
      if (audioRef.current) {
        audioRef.current.close().catch(() => { /* ignore */ })
        audioRef.current = null
      }
    }
  }, [])

  if (subjects.length === 0) return null

  const display = preview ?? subjects[0]
  const name = display.name[locale] ?? display.name['ko'] ?? ''
  const catName = display.category_name[locale] ?? display.category_name['ko'] ?? ''
  const color = getCategoryColor(display.category_slug)

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <Shuffle className="w-5 h-5 text-primary" />
        {locale === 'ko' ? '랜덤 추천' : 'Random Pick'}
      </h2>

      <div className="bg-card border border-border overflow-hidden">
        {/* Subject display area */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {display.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={display.image_url}
              alt={name}
              className={`w-full h-full object-cover transition-all duration-150 ${picking ? 'blur-sm scale-105' : ''}`}
              referrerPolicy="no-referrer"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center transition-all duration-150 ${picking ? 'scale-105' : ''}`}>
              <CategoryIcon name={display.category_icon} className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay with name */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-5">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-4 h-4 rounded-full ${color} flex items-center justify-center`}>
                  <CategoryIcon name={display.category_icon} className="w-2.5 h-2.5 text-white" />
                </span>
                <span className="text-[11px] text-white/70 font-medium">{catName}</span>
              </div>
              <p className={`font-display text-xl text-white font-bold transition-all duration-150 ${picking ? 'opacity-60' : ''} ${revealed ? 'text-2xl' : ''}`}>
                {name}
              </p>
            </div>
          </div>

          {/* Shuffling indicator */}
          {picking && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center animate-spin">
                <Shuffle className="w-5 h-5 text-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Action area */}
        <div className="p-5">
          {revealed && result ? (
            <div className="flex gap-2">
              <Link
                href={`/${locale}/subject/${result.id}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                {locale === 'ko' ? '평가하기' : 'Rate'} <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={pickRandom}
                disabled={picking}
                className="px-4 py-2.5 text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={pickRandom}
              disabled={picking}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              {picking
                ? (locale === 'ko' ? '고르는 중...' : 'Picking...')
                : (locale === 'ko' ? '랜덤으로 뽑기' : 'Pick Random')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
