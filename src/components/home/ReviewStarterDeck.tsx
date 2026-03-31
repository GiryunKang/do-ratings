'use client'

import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import Link from 'next/link'

interface ReviewStarterDeckProps {
  locale: string
}

interface PromptCard {
  emoji: string
  ko: string
  en: string
  category: string
  categorySlug: string
}

const PROMPTS: PromptCard[] = [
  { emoji: '✈️', ko: '마지막으로 탄 비행기를 평가하세요', en: 'Rate your last flight', category: '항공사', categorySlug: 'airlines' },
  { emoji: '🍽️', ko: '어제 간 맛집은 어떠셨나요?', en: 'How was your last restaurant?', category: '맛집', categorySlug: 'restaurants' },
  { emoji: '🏨', ko: '최근 호텔 경험을 공유하세요', en: 'Share your hotel experience', category: '호텔', categorySlug: 'hotels' },
  { emoji: '🏢', ko: '당신의 회사를 평가해보세요', en: 'Rate your company', category: '기업', categorySlug: 'companies' },
  { emoji: '📍', ko: '좋아하는 장소를 추천하세요', en: 'Recommend a favorite place', category: '장소', categorySlug: 'places' },
  { emoji: '👤', ko: '존경하는 인물에게 별점을', en: 'Rate someone you admire', category: '인물', categorySlug: 'people' },
  { emoji: '⭐', ko: '오늘 경험한 것 하나를 평가하세요', en: 'Rate one thing from today', category: '전체', categorySlug: '' },
]

function Card({
  card,
  index,
  totalCards,
  locale,
  onSwipe,
}: {
  card: PromptCard
  index: number
  totalCards: number
  locale: string
  onSwipe: () => void
}) {
  const isTop = index === totalCards - 1
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const motionOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  const stackOffset = (totalCards - 1 - index) * 4
  const stackScale = 1 - (totalCards - 1 - index) * 0.04

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe()
    }
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? motionOpacity : 1,
        y: stackOffset,
        scale: stackScale,
        zIndex: index,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileHover={isTop ? { scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20 rounded-2xl ring-1 ring-foreground/[0.08] shadow-lg p-6 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing select-none">
        <span className="text-5xl mb-4">{card.emoji}</span>
        <p className="text-base font-bold text-foreground mb-2 [word-break:keep-all]">
          {locale === 'ko' ? card.ko : card.en}
        </p>
        <span className="text-xs text-muted-foreground mb-4">
          {locale === 'ko' ? card.category : card.categorySlug || 'All'}
        </span>
        <Link
          href={`/${locale}/explore${card.categorySlug ? `?category=${card.categorySlug}` : ''}`}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {locale === 'ko' ? '평가하러 가기' : 'Start Rating'}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        {isTop && (
          <p className="text-[10px] text-muted-foreground/60 mt-3">
            {locale === 'ko' ? '← 밀어서 다음 카드' : '← Swipe for next'}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default function ReviewStarterDeck({ locale }: ReviewStarterDeckProps) {
  const [deck, setDeck] = useState(() => [...PROMPTS])

  function handleSwipe() {
    setDeck(prev => {
      const next = [...prev]
      const removed = next.pop()
      if (removed) next.unshift(removed)
      return next
    })
  }

  const visibleCards = deck.slice(-3)

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-lg">🃏</span>
        {locale === 'ko' ? '무엇을 평가할까요?' : 'What Will You Rate?'}
      </h2>
      <div className="relative w-full max-w-sm mx-auto" style={{ height: 260 }}>
        {visibleCards.map((card, i) => (
          <Card
            key={card.categorySlug + card.emoji}
            card={card}
            index={i}
            totalCards={visibleCards.length}
            locale={locale}
            onSwipe={handleSwipe}
          />
        ))}
      </div>
    </section>
  )
}
