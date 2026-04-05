'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

interface ReviewStarterDeckProps {
  locale: string
}

interface PromptCard {
  emoji: string
  ko: string
  en: string
  category: string
  categorySlug: string
  bgColor: string
}

const PROMPTS: PromptCard[] = [
  { emoji: '✈️', ko: '마지막으로 탄 비행기를 평가하세요', en: 'Rate your last flight', category: '항공사', categorySlug: 'airlines', bgColor: 'bg-sky-50' },
  { emoji: '🍽️', ko: '어제 간 맛집은 어떠셨나요?', en: 'How was your last restaurant?', category: '맛집', categorySlug: 'restaurants', bgColor: 'bg-orange-50' },
  { emoji: '🏨', ko: '최근 호텔 경험을 공유하세요', en: 'Share your hotel experience', category: '호텔', categorySlug: 'hotels', bgColor: 'bg-teal-50' },
  { emoji: '🏢', ko: '당신의 회사를 평가해보세요', en: 'Rate your company', category: '기업', categorySlug: 'companies', bgColor: 'bg-blue-50' },
  { emoji: '📍', ko: '좋아하는 장소를 추천하세요', en: 'Recommend a favorite place', category: '장소', categorySlug: 'places', bgColor: 'bg-emerald-50' },
  { emoji: '👤', ko: '존경하는 인물에게 별점을', en: 'Rate someone you admire', category: '인물', categorySlug: 'people', bgColor: 'bg-rose-50' },
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
      <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        {locale === 'ko' ? '첫 평가를 시작해보세요' : 'Start Your First Review'}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {locale === 'ko' ? '카드를 넘기면서 관심 있는 주제를 찾아보세요' : 'Swipe through cards to find your interest'}
      </p>

      <div className={`${card.bgColor} rounded-xl p-8 text-center transition-colors duration-300`}>
        <p className="text-4xl mb-3">{card.emoji}</p>
        <p className="font-display text-xl font-bold tracking-tight text-foreground mb-1">
          {locale === 'ko' ? card.ko : card.en}
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          {locale === 'ko' ? card.category : card.categorySlug}
        </p>

        <Link
          href={`/${locale}/explore${card.categorySlug ? `?category=${card.categorySlug}` : ''}`}
          className="inline-flex items-center gap-1.5 px-6 py-3 text-sm font-bold bg-primary text-white rounded-full hover:opacity-90 transition-opacity"
        >
          {locale === 'ko' ? '평가하러 가기' : 'Start Rating'} →
        </Link>

        <div className="flex items-center justify-center gap-4 mt-5">
          <button onClick={prev} className="p-2 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors bg-white/60">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5">
            {PROMPTS.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-primary' : 'bg-foreground/15'}`} />
            ))}
          </div>
          <button onClick={next} className="p-2 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors bg-white/60">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
