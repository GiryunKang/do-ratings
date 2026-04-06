import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 36,
        background: 'linear-gradient(135deg, #FF6B35, #FF8B5E, #db2777)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <svg width="70" height="70" viewBox="0 0 24 24" fill="#facc15">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: -1 }}>DO!</span>
    </div>,
    { ...size }
  )
}
