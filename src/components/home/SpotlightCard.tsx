'use client'

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
    <div className="hover:-translate-y-1 transition-transform duration-200">
      <Link
        href={href}
        className="relative bg-card rounded-2xl shadow-sm ring-1 ring-foreground/[0.06] p-5 hover:ring-border hover:shadow-md transition-all group overflow-hidden block"
      >
        {/* Category color top accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${getCategoryColor(categorySlug)}`} />
        <div className="flex items-center gap-1.5 mb-3">
          <span className={`w-5 h-5 rounded-full ${getCategoryColor(categorySlug)} flex items-center justify-center`}>
            <CategoryIcon name={categoryIcon} className="w-3 h-3 text-white" />
          </span>
          <span className="text-xs text-muted-foreground">{catName}</span>
        </div>
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg mb-1">{name}</h3>
        {desc && <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{desc}</p>}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-background bg-foreground rounded-full px-4 py-1.5 shadow-sm transition-all">
          {rateLabel}
        </span>
      </Link>
    </div>
  )
}
