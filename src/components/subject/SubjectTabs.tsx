'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

export default function SubjectTabs({ subjectId, locale, images }: SubjectTabsProps) {
  return (
    <Tabs defaultValue="reviews">
      <TabsList className="w-full">
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        {images.length > 0 && (
          <TabsTrigger value="photos">Photos</TabsTrigger>
        )}
        <TabsTrigger value="trend">Trend</TabsTrigger>
        <TabsTrigger value="summary">AI Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="reviews" className="mt-4">
        <ReviewList subjectId={subjectId} />
      </TabsContent>

      {images.length > 0 && (
        <TabsContent value="photos" className="mt-4">
          <ImageGallery images={images} />
        </TabsContent>
      )}

      <TabsContent value="trend" className="mt-4">
        <TrendChart subjectId={subjectId} locale={locale} />
      </TabsContent>

      <TabsContent value="summary" className="mt-4">
        <AISummary subjectId={subjectId} locale={locale} />
      </TabsContent>
    </Tabs>
  )
}
