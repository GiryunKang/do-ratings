'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { CategoryIcon } from '@/lib/icons'
import { proxyImageUrl } from '@/lib/utils/image-proxy'
import { displayRating } from '@/lib/utils/rating'

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
    <div className="relative group/carousel overflow-hidden">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card border border-border flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-muted"
      >
        <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-card border border-border flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-muted"
      >
        <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-2 py-1"
      >
        {subjects.map((subject) => {
          const bgColor = getCategoryColor(subject.category_slug)
          const subjectName = subject.name[locale] ?? subject.name['ko']
          const catName = subject.category_name[locale] ?? subject.category_name['ko']

          return (
            <div key={subject.id} className="shrink-0 snap-center">
              <Link
                href={`/${locale}/subject/${subject.id}`}
                className={`group relative block w-[280px] md:w-[320px] aspect-[16/9] overflow-hidden ${subject.image_url ? '' : bgColor}`}
              >
                {/* Image */}
                {subject.image_url ? (
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proxyImageUrl(subject.image_url) ?? ''}
                      alt={subjectName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(26,26,24,0.8), transparent)' }}
                    />
                  </div>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(26,26,24,0.6), transparent)' }}
                  />
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-1 text-[11px] text-white font-medium border border-white/10">
                      <CategoryIcon name={subject.category_icon} className="w-3 h-3" />
                      {catName}
                    </span>
                    {subject.avg_rating != null && (
                      <span className="text-[11px] text-primary font-semibold">★ {displayRating(subject.avg_rating)}</span>
                    )}
                  </div>
                  <h3 className="font-display text-white text-base md:text-lg leading-tight line-clamp-2">
                    {subjectName}
                  </h3>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
