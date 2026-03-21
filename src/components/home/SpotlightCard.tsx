'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CategoryIcon } from '@/lib/icons'
import { getCategoryColor } from '@/lib/utils/category-colors'

interface SpotlightCardProps {
  href: string
  name: string
  desc: string
  catName: string
  categorySlug: string
  categoryIcon: string
  rateLabel: string
}

export default function SpotlightCard({
  href,
  name,
  desc,
  catName,
  categorySlug,
  categoryIcon,
  rateLabel,
}: SpotlightCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, rotateY: 3, rotateX: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Link
        href={href}
        className="relative bg-card rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-lg transition-all group overflow-hidden block"
      >
        {/* Category color top accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${getCategoryColor(categorySlug)}`} />
        <div className="flex items-center gap-1.5 mb-3">
          <span className={`w-5 h-5 rounded-full ${getCategoryColor(categorySlug)} flex items-center justify-center`}>
            <CategoryIcon name={categoryIcon} className="w-3 h-3 text-white" />
          </span>
          <span className="text-xs text-gray-400">{catName}</span>
        </div>
        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-lg mb-1">{name}</h3>
        {desc && <p className="text-xs text-gray-500 line-clamp-1 mb-3">{desc}</p>}
        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-3 py-1">
          {rateLabel}
        </span>
      </Link>
    </motion.div>
  )
}
