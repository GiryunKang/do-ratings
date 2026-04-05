'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PenLine } from 'lucide-react'

interface GhostReviewsProps {
  locale: string
  writeHref: string
}

const GHOST_CARDS = [
  { stars: 5, lines: [85, 100, 60] },
  { stars: 4, lines: [100, 70, 90] },
  { stars: 5, lines: [75, 95, 45] },
  { stars: 3, lines: [90, 65, 80] },
]

export default function GhostReviews({ locale, writeHref }: GhostReviewsProps) {
  return (
    <section className="relative">
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground mb-2 flex items-center gap-2">
        <PenLine className="w-5 h-5 text-primary" />
        {locale === 'ko' ? '아직 평가가 없습니다' : 'No Reviews Yet'}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {locale === 'ko' ? '첫 번째 평가자가 되어주세요. 당신의 의견이 기준이 됩니다.' : 'Be the first to review. Your opinion sets the standard.'}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {GHOST_CARDS.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link
              href={writeHref}
              className="group block relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-2.5 w-16 bg-muted rounded-full" />
                  <div className="h-2 w-10 bg-muted/60 rounded-full mt-1" />
                </div>
              </div>

              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${i < card.stars ? 'text-primary/25' : 'text-muted-foreground/10'}`}
                  >
                    ★
                  </span>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                {card.lines.map((width, i) => (
                  <div
                    key={i}
                    className="h-2 bg-muted rounded-full"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/60">
                <span className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                  {locale === 'ko' ? '첫 평가 작성하기' : 'Write first review'}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link
          href={writeHref}
          className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 text-sm rounded-full hover:opacity-90 transition-opacity"
        >
          <PenLine className="w-4 h-4" />
          {locale === 'ko' ? '첫 번째 평가 작성하기' : 'Write the First Review'}
        </Link>
      </div>
    </section>
  )
}
