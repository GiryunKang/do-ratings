import { ImageResponse } from 'next/og'

export const alt = 'Do! Ratings!'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function Star({ size: s }: { size: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#facc15">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const fontData = await fetch(
    'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLGC.ttf'
  ).then(res => res.arrayBuffer())

  const subtitle = locale === 'ko'
    ? '세상 모든 것에 별점을!'
    : 'Rate Everything in the World!'

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
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 35%, #4f46e5 60%, #7c3aed 80%, #db2777 100%)',
        padding: 50,
        fontFamily: 'Noto Sans KR',
      }}
    >
      {/* 5 Stars above the logo */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Star size={52} />
        <Star size={52} />
        <Star size={52} />
        <Star size={52} />
        <Star size={52} />
      </div>

      {/* DO! RATINGS! — big and bold */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 20 }}>
        <span style={{ fontSize: 110, fontWeight: 900, color: '#ffffff', letterSpacing: -4 }}>DO!</span>
        <span style={{ fontSize: 110, fontWeight: 900, color: '#facc15', letterSpacing: -4 }}>RATINGS!</span>
      </div>

      {/* Subtitle — large and clear */}
      <div style={{ display: 'flex', fontSize: 40, color: 'rgba(255,255,255,0.95)', textAlign: 'center', fontWeight: 700, marginBottom: 28 }}>
        {subtitle}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
        {stats}
      </div>

      {/* Domain */}
      <div style={{ display: 'flex', position: 'absolute', bottom: 36, fontSize: 26, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
        do-ratings.com
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Noto Sans KR', data: fontData, style: 'normal', weight: 700 }],
    }
  )
}
