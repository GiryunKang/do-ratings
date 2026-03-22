import { ImageResponse } from 'next/og'

export const size = { width: 48, height: 48 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: '#4f46e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="#facc15">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>,
    { ...size }
  )
}
