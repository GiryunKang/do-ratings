'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PenLine } from 'lucide-react'

interface GhostReviewsProps {
  locale: string
}

const GHOST_CARDS = [
  { stars: 5, lines: [85, 100, 60] },
  { stars: 4, lines: [100, 70, 90] },
  { stars: 5, lines: [75, 95, 45] },
  { stars: 3, lines: [90, 65, 80] },
]

export default function GhostReviews({ locale }: GhostReviewsProps) {
  return (
    <section className="relative">
      <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
        <PenLine className="w-5 h-5 text-primary" />
        {locale === 'ko' ? '여기에 당신의 리뷰가 올 수 있습니다' : 'Your Review Could Be Here'}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {GHOST_CARDS.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, rotateY: 90 }}
            whileInView={{ opacity: 1, rotateY: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.6,
              delay: index * 0.15,
              type: 'spring',
              stiffness: 150,
            }}
            style={{ perspective: 800 }}
          >
            <Link
              href={`/${locale}/explore`}
              className="group block relative bg-card/50 rounded-2xl ring-1 ring-foreground/[0.04] p-4 hover:ring-primary/20 hover:shadow-lg hover:bg-card/80 transition-all duration-300 overflow-hidden"
            >
              {/* Shimmer overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
              </div>

              {/* Ghost avatar */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-muted/60 animate-pulse" />
                <div className="flex-1">
                  <div className="h-2.5 w-16 bg-muted/50 rounded-full" />
                  <div className="h-2 w-10 bg-muted/30 rounded-full mt-1" />
                </div>
              </div>

              {/* Ghost stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0.15 }}
                    whileInView={{ opacity: i < card.stars ? 0.3 : 0.1 }}
                    transition={{ delay: index * 0.15 + i * 0.05 }}
                    className="text-yellow-400/40 text-sm"
                  >
                    ★
                  </motion.span>
                ))}
              </div>

              {/* Ghost text lines */}
              <div className="space-y-2 mb-4">
                {card.lines.map((width, i) => (
                  <div
                    key={i}
                    className="h-2 bg-muted/40 rounded-full"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>

              {/* CTA on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg"
                >
                  {locale === 'ko' ? '내가 채우기 ✍️' : 'Fill this spot ✍️'}
                </motion.span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Shimmer keyframe */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  )
}
