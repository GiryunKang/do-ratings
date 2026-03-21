'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReviewList from '@/components/review/ReviewList'
import ImageGallery from '@/components/review/ImageGallery'
import TrendChart from '@/components/analytics/TrendChart'
import AISummary from '@/components/analytics/AISummary'
import EmbedWidget from '@/components/embed/EmbedWidget'

interface GalleryImage {
  id: string
  url: string
}

interface SubjectTabsProps {
  subjectId: string
  locale: string
  images: GalleryImage[]
  subjectName?: string
  avgRating?: number | null
  reviewCount?: number
}

const tabs = [
  { key: 'reviews', ko: '리뷰', en: 'Reviews' },
  { key: 'photos', ko: '사진', en: 'Photos' },
  { key: 'trend', ko: '트렌드', en: 'Trend' },
  { key: 'summary', ko: 'AI 요약', en: 'AI Summary' },
  { key: 'embed', ko: '공유', en: 'Share' },
]

export default function SubjectTabs({
  subjectId,
  locale,
  images,
  subjectName,
  avgRating,
  reviewCount,
}: SubjectTabsProps) {
  const [activeTab, setActiveTab] = useState('reviews')

  const visibleTabs = tabs.filter(t => t.key !== 'photos' || images.length > 0)

  return (
    <div>
      {/* Tab list */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 overflow-x-auto scrollbar-hide">
        {visibleTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {locale === 'ko' ? tab.ko : tab.en}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          {activeTab === 'reviews' && <ReviewList subjectId={subjectId} />}
          {activeTab === 'photos' && images.length > 0 && <ImageGallery images={images} />}
          {activeTab === 'trend' && <TrendChart subjectId={subjectId} locale={locale} />}
          {activeTab === 'summary' && <AISummary subjectId={subjectId} locale={locale} />}
          {activeTab === 'embed' && subjectName && (
            <EmbedWidget
              subjectId={subjectId}
              subjectName={subjectName}
              avgRating={avgRating ?? null}
              reviewCount={reviewCount ?? 0}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
