'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { CategoryIcon } from '@/lib/icons'

interface Subject {
  id: string
  name: Record<string, string>
  avg_rating: number | null
  review_count: number
  category_slug: string
  category_name: Record<string, string>
  category_icon: string
  image_url?: string | null
}

export default function FeaturedCarousel({
  subjects,
  locale,
}: {
  subjects: Subject[]
  locale: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  if (subjects.length === 0) return null

  return (
    <div className="relative mb-4">
      {/* Scroll left */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
        aria-label="Scroll left"
      >
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Scroll right */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
        aria-label="Scroll right"
      >
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 py-1"
      >
        {subjects.map((subject) => {
          const bgColor = getCategoryColor(subject.category_slug)
          const subjectName = subject.name[locale] ?? subject.name['ko']
          const catName = subject.category_name[locale] ?? subject.category_name['ko']

          return (
            <Link
              key={subject.id}
              href={`/${locale}/subject/${subject.id}`}
              className={`relative shrink-0 w-[300px] aspect-[16/9] rounded-2xl overflow-hidden snap-center ${subject.image_url ? '' : bgColor} hover:shadow-xl transition-shadow`}
            >
              {subject.image_url ? (
                <div className="absolute inset-0">
                  <img src={subject.image_url} alt={subjectName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              )}

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs text-white font-medium">
                    <CategoryIcon name={subject.category_icon} className="w-3.5 h-3.5" />
                    {catName}
                  </span>
                  {subject.avg_rating != null && (
                    <span className="text-xs text-white/80">★ {subject.avg_rating.toFixed(1)}</span>
                  )}
                </div>
                <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                  {subjectName}
                </h3>
                <p className="text-white/70 text-xs mt-1">
                  {locale === 'ko' ? '더 보기' : 'See more'} →
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
