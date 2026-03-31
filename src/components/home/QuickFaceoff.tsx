'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { CategoryIcon } from '@/lib/icons'

interface FaceoffSubject {
  id: string
  name: Record<string, string>
  avg_rating: number | null
  image_url: string | null
  category_slug: string
  category_icon: string
  category_name: Record<string, string>
}

interface QuickFaceoffProps {
  subjects: FaceoffSubject[]
  locale: string
}

export default function QuickFaceoff({ subjects, locale }: QuickFaceoffProps) {
  const [pair, setPair] = useState<[FaceoffSubject, FaceoffSubject] | null>(() => pickPair(subjects))
  const [voted, setVoted] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)

  const nextRound = useCallback(() => {
    setVoted(null)
    setPair(pickPair(subjects))
    setRound(r => r + 1)
  }, [subjects])

  const handleVote = useCallback((id: string) => {
    if (voted) return
    setVoted(id)
    setScore(s => s + 1)
    setTimeout(nextRound, 1200)
  }, [voted, nextRound])

  if (!pair) return null

  const [a, b] = pair

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="text-lg">🆚</span>
          {locale === 'ko' ? '퀵 대결' : 'Quick Face-off'}
        </h2>
        <span className="text-xs text-muted-foreground font-medium">
          {score} {locale === 'ko' ? '회 투표' : 'votes'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((subject, idx) => {
          const name = subject.name[locale] ?? subject.name['ko'] ?? ''
          const catName = subject.category_name[locale] ?? subject.category_name['ko'] ?? ''
          const color = getCategoryColor(subject.category_slug)
          const isWinner = voted === subject.id
          const isLoser = voted !== null && voted !== subject.id

          return (
            <motion.button
              key={`${round}-${subject.id}`}
              type="button"
              onClick={() => handleVote(subject.id)}
              disabled={voted !== null}
              initial={{ opacity: 0, x: idx === 0 ? -30 : 30 }}
              animate={{
                opacity: isLoser ? 0.5 : 1,
                x: 0,
                scale: isWinner ? 1.03 : isLoser ? 0.97 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`relative bg-card rounded-2xl ring-1 overflow-hidden text-left transition-all ${
                isWinner
                  ? 'ring-green-400 shadow-lg shadow-green-500/10'
                  : isLoser
                  ? 'ring-foreground/[0.04]'
                  : 'ring-foreground/[0.06] hover:ring-primary/30 hover:shadow-md active:scale-[0.98]'
              }`}
            >
              {/* Image or color header */}
              {subject.image_url ? (
                <div className="h-28 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={subject.image_url}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : (
                <div className={`h-20 ${color} flex items-center justify-center`}>
                  <CategoryIcon name={subject.category_icon} className="w-8 h-8 text-white/30" />
                </div>
              )}

              <div className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className={`w-3.5 h-3.5 rounded-full ${color} flex items-center justify-center`}>
                    <CategoryIcon name={subject.category_icon} className="w-2 h-2 text-white" />
                  </span>
                  <span className="text-[10px] text-muted-foreground">{catName}</span>
                </div>
                <p className="text-sm font-bold text-foreground line-clamp-1">{name}</p>
                {subject.avg_rating != null && (
                  <p className="text-xs text-yellow-500 font-medium mt-1">★ {subject.avg_rating.toFixed(1)}</p>
                )}
              </div>

              {/* Winner badge */}
              <AnimatePresence>
                {isWinner && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md"
                  >
                    ✓ {locale === 'ko' ? '선택!' : 'Picked!'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* VS badge */}
      <div className="flex justify-center -mt-6 mb-2 relative z-10">
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-full bg-card shadow-lg ring-2 ring-indigo-300 flex items-center justify-center text-xs font-black text-indigo-600"
        >
          VS
        </motion.span>
      </div>
    </section>
  )
}

function pickPair(subjects: FaceoffSubject[]): [FaceoffSubject, FaceoffSubject] | null {
  if (subjects.length < 2) return null

  const categorized = new Map<string, FaceoffSubject[]>()
  for (const s of subjects) {
    const list = categorized.get(s.category_slug) ?? []
    list.push(s)
    categorized.set(s.category_slug, list)
  }

  const eligibleCategories = [...categorized.entries()].filter(([, list]) => list.length >= 2)

  if (eligibleCategories.length > 0) {
    const [, catSubjects] = eligibleCategories[Math.floor(Math.random() * eligibleCategories.length)]
    const shuffled = [...catSubjects].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }

  const shuffled = [...subjects].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1]]
}
