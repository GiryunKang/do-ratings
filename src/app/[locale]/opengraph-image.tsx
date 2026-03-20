import { ImageResponse } from 'next/og'

export const alt = 'Do! Ratings!'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Load Noto Sans KR for Korean text
  const fontData = await fetch(
    'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLGC.ttf'
  ).then(res => res.arrayBuffer())

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
        fontFamily: 'Noto Sans KR',
      }}
    >
      {/* Stars as yellow circles */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: 20,
            background: '#facc15',
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
          }} />
        ))}
      </div>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
        <span style={{ fontSize: 88, fontWeight: 900, color: '#ffffff', letterSpacing: -3 }}>DO!</span>
        <span style={{ fontSize: 88, fontWeight: 900, color: '#facc15', letterSpacing: -3 }}>RATINGS!</span>
      </div>

      {/* Subtitle */}
      <div style={{ display: 'flex', fontSize: 32, color: 'rgba(255,255,255,0.9)', textAlign: 'center', maxWidth: 900, marginBottom: 36, fontWeight: 500 }}>
        {subtitle}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
        {stats}
      </div>

      {/* Domain */}
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 24, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
        do-ratings.com
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  )
}
