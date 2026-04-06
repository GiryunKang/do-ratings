'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface ShuffleSubject {
  id: string
  name: Record<string, string>
  avg_rating: number | null
  review_count: number
  image_url: string | null
  category_slug: string
  category_name: Record<string, string>
  category_icon: string
}

interface SubjectShuffleProps {
  subjects: ShuffleSubject[]
  locale: string
}

export default function SubjectShuffle({ subjects, locale }: SubjectShuffleProps) {
  const [displayed, setDisplayed] = useState<ShuffleSubject[]>(() => pickRandom(subjects, 3))
  const [shuffleKey, setShuffleKey] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)

  const handleShuffle = useCallback(() => {
    if (isShuffling || subjects.length < 3) return
    setIsShuffling(true)

    setTimeout(() => {
      setDisplayed(pickRandom(subjects, 3))
      setShuffleKey(k => k + 1)
      setIsShuffling(false)
    }, 400)
  }, [isShuffling, subjects])

  if (subjects.length < 3) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span className="text-lg">🎲</span>
          {locale === 'ko' ? '오늘의 발견' : 'Discover Today'}
        </h2>
        <button
          onClick={handleShuffle}
          disabled={isShuffling}
          className="group flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-foreground text-background shadow-md hover:shadow-lg hover:opacity-90 active:scale-95 transition-opacity disabled:opacity-60"
        >
          <motion.span
            animate={isShuffling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block"
          >
            🎲
          </motion.span>
          {locale === 'ko' ? '셔플' : 'Shuffle'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {displayed.map((subject, index) => {
            const name = subject.name[locale] ?? subject.name['ko'] ?? ''
            const catName = subject.category_name[locale] ?? subject.category_name['ko'] ?? ''
            const color = getCategoryColor(subject.category_slug)

            return (
              <motion.div
                key={`${shuffleKey}-${subject.id}`}
                initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -90, opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 200,
                }}
                style={{ perspective: 1000 }}
              >
                <Link
                  href={`/${locale}/subject/${subject.id}`}
                  className="group block relative bg-card rounded-xl shadow-sm ring-1 ring-foreground/[0.06] overflow-hidden hover:shadow-lg hover:ring-primary/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Top accent bar */}
                  <div className={`h-1.5 ${color}`} />

                  {/* Image or gradient */}
                  {subject.image_url ? (
                    <div className="h-32 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={subject.image_url}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement?.classList.add(color.replace('bg-', 'bg-'), 'flex', 'items-center', 'justify-center')
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* Floating rating badge */}
                      {subject.avg_rating != null && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          ★ {subject.avg_rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`h-24 ${color} flex items-center justify-center relative`}>
                      <CategoryIcon name={subject.category_icon} className="w-10 h-10 text-white/40" />
                      {subject.avg_rating != null && (
                        <div className="absolute bottom-2 right-2 bg-black/40 text-primary text-xs font-bold px-2 py-1 rounded-full">
                          ★ {subject.avg_rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-4 h-4 rounded-full ${color} flex items-center justify-center`}>
                        <CategoryIcon name={subject.category_icon} className="w-2.5 h-2.5 text-white" />
                      </span>
                      <span className="text-[11px] text-muted-foreground">{catName}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">{name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {subject.review_count > 0
                          ? `${subject.review_count} ${locale === 'ko' ? '리뷰' : 'reviews'}`
                          : locale === 'ko' ? '첫 리뷰 대기 중' : 'Be the first!'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Hover CTA overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                    <span className="bg-white text-foreground font-semibold text-sm px-5 py-2 rounded-full shadow-lg">
                      {locale === 'ko' ? '평가하기 →' : 'Rate now →'}
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
