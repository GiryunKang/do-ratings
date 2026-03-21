'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { getCategoryColor } from '@/lib/utils/category-colors'
import { CategoryIcon } from '@/lib/icons'
import { proxyImageUrl } from '@/lib/utils/image-proxy'

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
    <div className="relative group/carousel">
      {/* Scroll buttons — appear on hover */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-black/60 hover:scale-110 border border-white/10"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-black/60 hover:scale-110 border border-white/10"
      >
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-2 py-1"
      >
        {subjects.map((subject, index) => {
          const bgColor = getCategoryColor(subject.category_slug)
          const subjectName = subject.name[locale] ?? subject.name['ko']
          const catName = subject.category_name[locale] ?? subject.category_name['ko']

          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08, duration: 0.4, type: 'spring', stiffness: 150 }}
              className="shrink-0 snap-center"
            >
              <Link
                href={`/${locale}/subject/${subject.id}`}
                className={`group relative block w-[280px] md:w-[320px] aspect-[16/9] rounded-2xl overflow-hidden ${subject.image_url ? '' : bgColor}`}
              >
                {/* Image */}
                {subject.image_url ? (
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proxyImageUrl(subject.image_url) ?? ''}
                      alt={subjectName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}

                {/* Hover overlay glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 text-[11px] text-white font-medium border border-white/10">
                      <CategoryIcon name={subject.category_icon} className="w-3 h-3" />
                      {catName}
                    </span>
                    {subject.avg_rating != null && (
                      <span className="text-[11px] text-yellow-300 font-semibold">★ {subject.avg_rating.toFixed(1)}</span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-base md:text-lg leading-tight line-clamp-2 drop-shadow-lg">
                    {subjectName}
                  </h3>
                  <p className="text-white/50 text-xs mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {locale === 'ko' ? '더 보기' : 'See more'}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
