'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface OnboardingModalProps {
  locale: string
  onComplete: () => void
}

const CATEGORIES = [
  { id: 'airlines', icon: '✈️' },
  { id: 'hotels', icon: '🏨' },
  { id: 'restaurants', icon: '🍽️' },
  { id: 'companies', icon: '🏢' },
  { id: 'places', icon: '📍' },
  { id: 'people', icon: '👤' },
] as const

type CategoryId = (typeof CATEGORIES)[number]['id']

export default function OnboardingModal({ locale, onComplete }: OnboardingModalProps) {
  const t = useTranslations('onboarding')
  const [step, setStep] = useState(0) // 0-indexed: 0, 1, 2
  const [selected, setSelected] = useState<Set<CategoryId>>(new Set())
  const [animating, setAnimating] = useState(false)

  const totalSteps = 3

  function toggleCategory(id: CategoryId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function goNext() {
    if (animating) return
    if (step === totalSteps - 1) {
      handleComplete()
      return
    }
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setAnimating(false)
    }, 200)
  }

  function handleSkip() {
    saveCategories()
    onComplete()
  }

  function handleComplete() {
    saveCategories()
    onComplete()
  }

  function saveCategories() {
    try {
      localStorage.setItem('onboarding_interests', JSON.stringify(Array.from(selected)))
    } catch {
      // ignore storage errors
    }
  }

  const categoryLabels: Record<CategoryId, string> = {
    airlines: locale === 'ko' ? '항공사' : 'Airlines',
    hotels: locale === 'ko' ? '호텔' : 'Hotels',
    restaurants: locale === 'ko' ? '음식점' : 'Restaurants',
    companies: locale === 'ko' ? '기업' : 'Companies',
    places: locale === 'ko' ? '장소' : 'Places',
    people: locale === 'ko' ? '인물' : 'People',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-xl bg-card p-8 shadow-2xl mx-4">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                i === step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-muted-foreground transition-colors"
        >
          {t('skip')}
        </button>

        {/* Step content */}
        <div
          className={`transition-all duration-200 ${
            animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Step 1: Choose Interests */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">{t('step1Title')}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t('step1Desc')}</p>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map(cat => {
                  const isSelected = selected.has(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-150 ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-border'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background text-[10px]">
                          ✓
                        </span>
                      )}
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-medium text-foreground/80">
                        {categoryLabels[cat.id]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Write First Review */}
          {step === 1 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('step2Title')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('step2Desc')}</p>
            </div>
          )}

          {/* Step 3: Join Community */}
          {step === 2 && (
            <div className="text-center py-4">
              <div className="text-6xl mb-6">🤝</div>
              <h2 className="text-xl font-bold text-foreground mb-3">{t('step3Title')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('step3Desc')}</p>
            </div>
          )}
        </div>

        {/* Next / Get Started button */}
        <button
          onClick={goNext}
          className="mt-8 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
        >
          {step === totalSteps - 1 ? t('getStarted') : t('next')}
        </button>
      </div>
    </div>
  )
}
