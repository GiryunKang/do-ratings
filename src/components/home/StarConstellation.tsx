'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface ConstellationStar {
  id: string
  name: Record<string, string>
  category_slug: string
  category_icon: string
  category_name: Record<string, string>
  orbit: { rx: number; ry: number; speed: number; offset: number; cx: number; cy: number }
}

interface StarConstellationProps {
  subjects: {
    id: string
    name: Record<string, string>
    category_slug: string
    category_icon: string
    category_name: Record<string, string>
  }[]
  locale: string
}

const ORBIT_PRESETS = [
  { rx: 38, ry: 18, speed: 60, cx: 50, cy: 50 },
  { rx: 30, ry: 25, speed: 45, cx: 50, cy: 50 },
  { rx: 22, ry: 14, speed: 55, cx: 50, cy: 50 },
  { rx: 42, ry: 12, speed: 70, cx: 50, cy: 50 },
  { rx: 15, ry: 30, speed: 50, cx: 50, cy: 50 },
  { rx: 35, ry: 22, speed: 65, cx: 50, cy: 50 },
  { rx: 28, ry: 28, speed: 40, cx: 50, cy: 50 },
  { rx: 44, ry: 16, speed: 75, cx: 50, cy: 50 },
]

export default function StarConstellation({ subjects, locale }: StarConstellationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const animRef = useRef<number>(0)
  const startTimeRef = useRef(Date.now())

  const stars: ConstellationStar[] = subjects.slice(0, 8).map((s, i) => ({
    ...s,
    orbit: { ...ORBIT_PRESETS[i % ORBIT_PRESETS.length], offset: (i * 45) % 360 },
  }))

  useEffect(() => {
    function animate() {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const newPositions: Record<string, { x: number; y: number }> = {}

      for (const star of stars) {
        const angle = ((elapsed / star.orbit.speed) * 360 + star.orbit.offset) * (Math.PI / 180)
        newPositions[star.id] = {
          x: star.orbit.cx + star.orbit.rx * Math.cos(angle),
          y: star.orbit.cy + star.orbit.ry * Math.sin(angle),
        }
      }

      setPositions(newPositions)
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  // stars array is derived from props, stable per render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Orbit rings (decorative) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 100 100" preserveAspectRatio="none">
        {ORBIT_PRESETS.slice(0, 4).map((o, i) => (
          <ellipse key={i} cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry} fill="none" stroke="white" strokeWidth="0.15" strokeDasharray="1 2" />
        ))}
      </svg>

      {/* Stars */}
      {stars.map((star) => {
        const pos = positions[star.id]
        if (!pos) return null
        const color = getCategoryColor(star.category_slug)
        const isHovered = hoveredId === star.id
        const name = star.name[locale] ?? star.name['ko'] ?? ''
        const catName = star.category_name[locale] ?? star.category_name['ko'] ?? ''

        return (
          <div
            key={star.id}
            className="absolute pointer-events-auto"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: isHovered ? 20 : 10,
            }}
            onMouseEnter={() => setHoveredId(star.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Star dot */}
            <motion.div
              animate={{
                scale: isHovered ? 1.8 : 1,
                boxShadow: isHovered
                  ? '0 0 20px rgba(255,255,255,0.4)'
                  : '0 0 8px rgba(255,255,255,0.2)',
              }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`w-3 h-3 rounded-full ${color} cursor-pointer`}
            />

            {/* Hover card */}
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute top-5 left-1/2 -translate-x-1/2 w-44 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-xl p-3 z-30"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-4 h-4 rounded-full ${color} flex items-center justify-center`}>
                    <CategoryIcon name={star.category_icon} className="w-2.5 h-2.5 text-white" />
                  </span>
                  <span className="text-[10px] text-gray-500">{catName}</span>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{name}</p>
                <Link
                  href={`/${locale}/subject/${star.id}`}
                  className="mt-2 block text-center text-[10px] font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-full py-1 transition-colors"
                >
                  {locale === 'ko' ? '첫 번째 리뷰어 되기 ✨' : 'Be the first reviewer ✨'}
                </Link>
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
