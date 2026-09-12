'use client'

import { useRouter } from 'next/navigation'

interface QuickRateStarsProps { subjectId: string; locale: string; size?: 'sm' | 'md' }

export default function QuickRateStars({ subjectId, locale, size = 'sm' }: QuickRateStarsProps) {
  const router = useRouter()
  return (
    <div className="inline-flex flex-wrap" aria-label={locale === 'ko' ? '평점 선택 후 리뷰 작성' : 'Choose a rating to write a review'}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" className={`inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary ${size === 'md' ? 'text-2xl' : 'text-xl'}`}
          aria-label={locale === 'ko' ? `${star * 2}점으로 리뷰 작성하기` : `Write a review with ${star * 2} out of 10`}
          onClick={() => router.push(`/${locale}/write/${subjectId}?rating=${star * 2}`)}>
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  )
}