import { ImageResponse } from 'next/og'

export const alt = 'Do! Ratings!'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const subtitle = locale === 'ko'
    ? '세상 모든 것에 별점을! 당신의 한 줄이 세상을 움직인다.'
    : 'Rate everything in the world! Your voice shapes the world.'

  const stats = locale === 'ko'
    ? '인물 · 기업 · 장소 · 항공사 · 호텔 · 레스토랑'
    : 'People · Companies · Places · Airlines · Hotels · Restaurants'

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #6366f1 70%, #8b5cf6 85%, #db2777 100%)',
        padding: 60,
      }}
    >
      {/* Stars row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ fontSize: 48, color: '#facc15' }}>★</span>
        ))}
      </div>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <span style={{ fontSize: 80, fontWeight: 900, color: '#ffffff', letterSpacing: -3 }}>DO!</span>
        <span style={{ fontSize: 80, fontWeight: 900, color: '#facc15', letterSpacing: -3 }}>RATINGS!</span>
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 800, marginBottom: 32 }}>
        {subtitle}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>
        {stats}
      </div>

      {/* Domain */}
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>
        do-ratings.com
      </div>
    </div>,
    { ...size }
  )
}
