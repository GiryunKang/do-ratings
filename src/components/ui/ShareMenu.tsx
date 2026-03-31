'use client'

import { useState } from 'react'

interface ShareMenuProps {
  url: string
  title: string
  type: 'subject' | 'review'
  locale: string
}

export default function ShareMenu({ url, title, type, locale }: ShareMenuProps) {
  const [copied, setCopied] = useState(false)
  const ko = locale === 'ko'

  const fullUrl = `https://do-ratings.com${url}`

  const shareText = type === 'subject'
    ? (ko ? '이 대상을 평가해보세요!' : 'Rate this!')
    : (ko ? '이 리뷰, 어떻게 생각하세요?' : 'What do you think about this review?')

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} — Do! Ratings!`,
          text: shareText,
          url: fullUrl,
        })
      } catch {
        // User cancelled or share failed — fallback to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? (ko ? '복사됨!' : 'Copied!') : (ko ? '공유' : 'Share')}
    </button>
  )
}
