'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react'

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
]

export default function ReviewStarterDeck({ locale }: ReviewStarterDeckProps) {
  const [index, setIndex] = useState(0)
  const card = PROMPTS[index]

  function next() {
    setIndex((i) => (i + 1) % PROMPTS.length)
  }

  function prev() {
    setIndex((i) => (i - 1 + PROMPTS.length) % PROMPTS.length)
  }

  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" />
        {locale === 'ko' ? '무엇을 평가할까요?' : 'What Will You Rate?'}
      </h2>

      <div className="bg-card border border-border p-8 text-center">
        <p className="text-3xl mb-4">{card.emoji}</p>
        <p className="font-serif text-lg font-bold text-foreground mb-2">
          {locale === 'ko' ? card.ko : card.en}
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          {locale === 'ko' ? card.category : card.categorySlug}
        </p>

        <Link
          href={`/${locale}/explore${card.categorySlug ? `?category=${card.categorySlug}` : ''}`}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          {locale === 'ko' ? '평가하러 가기' : 'Start Rating'} →
        </Link>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={prev} className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">{index + 1} / {PROMPTS.length}</span>
          <button onClick={next} className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
