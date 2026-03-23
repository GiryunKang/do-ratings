'use client'

import { useState, useEffect } from 'react'

interface ShareMenuProps {
  url: string
  title: string
  type: 'subject' | 'review'
  locale: string
}

export default function ShareMenu({ url, title, type, locale }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ko = locale === 'ko'

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${url}`
    : `https://do-ratings.com${url}`

  const shareText = type === 'subject'
    ? (ko ? `이 대상을 평가해보세요! — Do! Ratings!` : `Rate this! — Do! Ratings!`)
    : (ko ? `이 리뷰, 어떻게 생각하세요? — Do! Ratings!` : `What do you think? — Do! Ratings!`)

  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedText = encodeURIComponent(`${title} — ${shareText}`)

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${title} — Do! Ratings!`, text: shareText, url: fullUrl })
    }
  }

  type ShareOption = { name: string; icon: string; action?: () => void; href?: string; label?: string }

  const shareOptions: ShareOption[] = [
    {
      name: ko ? 'URL 복사' : 'Copy URL',
      icon: copied ? '✅' : '🔗',
      action: handleCopy,
      label: copied ? (ko ? '복사됨!' : 'Copied!') : undefined,
    },
    {
      name: 'KakaoTalk',
      icon: '💬',
      href: `https://sharer.kakao.com/talk/friends/picker/link?url=${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ]

  // Native share added at render time (client only)
  const [hasNativeShare, setHasNativeShare] = useState(false)
  useEffect(() => { setHasNativeShare(!!navigator.share) }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {ko ? '공유' : 'Share'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-xl z-50 py-1 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            {hasNativeShare && (
              <button
                onClick={() => { handleNativeShare(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <span className="text-base w-5 text-center">📤</span>
                <span>{ko ? '공유하기' : 'Share'}</span>
              </button>
            )}
            {shareOptions.map((opt, i) => (
              opt.action ? (
                <button
                  key={i}
                  onClick={() => { opt.action?.(); if (!opt.label) setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="text-base w-5 text-center">{opt.icon}</span>
                  <span>{opt.label ?? opt.name}</span>
                </button>
              ) : (
                <a
                  key={i}
                  href={opt.href ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="text-base w-5 text-center">{opt.icon}</span>
                  <span>{opt.name}</span>
                </a>
              )
            ))}
          </div>
        </>
      )}
    </div>
  )
}
