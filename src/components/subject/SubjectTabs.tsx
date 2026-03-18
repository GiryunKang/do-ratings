'use client'

import { useState } from 'react'
import ReviewList from '@/components/review/ReviewList'
import ImageGallery from '@/components/review/ImageGallery'
import TrendChart from '@/components/analytics/TrendChart'
import AISummary from '@/components/analytics/AISummary'

interface GalleryImage {
  id: string
  url: string
}

interface SubjectTabsProps {
  subjectId: string
  locale: string
  images: GalleryImage[]
}

const tabs = [
  { key: 'reviews', ko: '리뷰', en: 'Reviews' },
  { key: 'photos', ko: '사진', en: 'Photos' },
  { key: 'trend', ko: '트렌드', en: 'Trend' },
  { key: 'summary', ko: 'AI 요약', en: 'AI Summary' },
]

export default function SubjectTabs({ subjectId, locale, images }: SubjectTabsProps) {
  const [activeTab, setActiveTab] = useState('reviews')

  const visibleTabs = tabs.filter(t => t.key !== 'photos' || images.length > 0)

  return (
    <div>
      {/* Tab list */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {visibleTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
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
      <div className="mt-4">
        {activeTab === 'reviews' && <ReviewList subjectId={subjectId} />}
        {activeTab === 'photos' && images.length > 0 && <ImageGallery images={images} />}
        {activeTab === 'trend' && <TrendChart subjectId={subjectId} locale={locale} />}
        {activeTab === 'summary' && <AISummary subjectId={subjectId} locale={locale} />}
      </div>
    </div>
  )
}
