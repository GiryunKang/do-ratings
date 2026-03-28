'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { proxyImageUrl } from '@/lib/utils/image-proxy'

interface SubjectItem {
  id: string
  name: Record<string, string>
  description: Record<string, string> | null
  avg_rating: number | null
  review_count: number
  image_url?: string | null
}

interface AutoScrollRowProps {
  subjects: SubjectItem[]
  categorySlug: string
  categoryIcon: string
  locale: string
  speed?: number // pixels per second, default 30
}

export default function AutoScrollRow({
  subjects,
  categorySlug,
  categoryIcon,
  locale,
  speed = 30,
}: AutoScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || subjects.length < 3) return

    let animId: number
    let lastTime: number | null = null

    function step(time: number) {
      if (!el) return
      if (lastTime !== null && !paused) {
        const delta = (time - lastTime) / 1000
        el.scrollLeft += speed * delta

        // Reset to start when we've scrolled past the first set
        const halfWidth = el.scrollWidth / 2
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth
        }
      }
      lastTime = time
      animId = requestAnimationFrame(step)
    }

    animId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animId)
  }, [paused, speed, subjects.length])

  // Duplicate subjects for seamless loop
  const displaySubjects = subjects.length >= 3
    ? [...subjects, ...subjects]
    : subjects

  const color = getCategoryColor(categorySlug)

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {displaySubjects.map((subject, index) => {
        const name = subject.name[locale] ?? subject.name['ko'] ?? subject.name['en'] ?? ''
        const desc = subject.description?.[locale] ?? subject.description?.['ko'] ?? ''
        const originalIndex = index % subjects.length

        return (
          <motion.div
            key={`${subject.id}-${index}`}
            className="shrink-0"
            whileHover={{ scale: 1.03, rotateY: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
          <Link
            href={`/${locale}/subject/${subject.id}`}
            className="block w-44 bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all group"
          >
            {/* Image or category color header */}
            {subject.image_url ? (
              <div className="h-24 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proxyImageUrl(subject.image_url) ?? ''}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {originalIndex < 3 && (
                  <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    originalIndex === 0 ? 'bg-yellow-400 text-white' : originalIndex === 1 ? 'bg-muted-foreground/30 text-white' : 'bg-amber-600 text-white'
                  }`}>{originalIndex + 1}</span>
                )}
              </div>
            ) : (
              <div className={`h-16 ${color} opacity-80 flex items-center justify-center relative`}>
                <CategoryIcon name={categoryIcon} className="w-8 h-8 text-white/40" />
                {originalIndex < 3 && (
                  <span className={`absolute top-2 right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    originalIndex === 0 ? 'bg-yellow-400 text-white' : originalIndex === 1 ? 'bg-muted-foreground/30 text-white' : 'bg-amber-600 text-white'
                  }`}>{originalIndex + 1}</span>
                )}
              </div>
            )}
            <div className="p-3">
              <h4 className="text-sm font-semibold text-foreground group-hover:text-indigo-600 transition-colors truncate">{name}</h4>
              {desc && <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>}
              <div className="flex items-center gap-1 mt-2 text-xs">
                {subject.avg_rating ? (
                  <span className="text-yellow-500 font-medium">★ {subject.avg_rating.toFixed(1)}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground/40 text-[11px]">★ ★ ★ ★ ★</span>
                    <span className="text-[10px] font-medium text-primary">{locale === 'ko' ? '첫 번째 리뷰어' : 'Be first'}</span>
                  </span>
                )}
              </div>
            </div>
          </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
