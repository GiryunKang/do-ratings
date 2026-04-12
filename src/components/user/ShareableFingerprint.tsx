'use client'

import { useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { displayRating } from '@/lib/utils/rating'

interface ShareableFingerprintProps {
  locale: string
  nickname: string
  avgRating: number
  totalReviews: number
  categorySpread: number
  personalityLabel: string
}

export default function ShareableFingerprint({
  locale,
  nickname,
  avgRating,
  totalReviews,
  categorySpread,
  personalityLabel,
}: ShareableFingerprintProps) {
  const handleShare = useCallback(async () => {
    const shareText = locale === 'ko'
      ? `🎨 ${nickname}의 DO! Ratings! 평가 성향\n${personalityLabel} · 평균 ${displayRating(avgRating)}점 · ${totalReviews}개 리뷰 · ${categorySpread}개 카테고리\n\nhttps://do-ratings.com`
      : `🎨 ${nickname}'s DO! Ratings! Profile\n${personalityLabel} · Avg ${displayRating(avgRating)} · ${totalReviews} reviews · ${categorySpread} categories\n\nhttps://do-ratings.com`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname} — DO! Ratings!`,
          text: shareText,
        })
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        alert(locale === 'ko' ? '클립보드에 복사되었습니다!' : 'Copied to clipboard!')
      } catch {
        // Clipboard not available
      }
    }
  }, [locale, nickname, personalityLabel, avgRating, totalReviews, categorySpread])

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-3"
    >
      <Share2 className="w-3.5 h-3.5" />
      {locale === 'ko' ? '내 평가 성향 공유하기' : 'Share my profile'}
    </button>
  )
}
