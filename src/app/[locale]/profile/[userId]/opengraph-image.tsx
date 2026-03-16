import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const alt = 'User Profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const levelColors: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  platinum: '#818cf8',
}

export default async function Image({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('nickname, level, review_count')
    .eq('id', userId)
    .single()

  const nickname = profile?.nickname ?? 'User'
  const level = (profile?.level as string) ?? 'bronze'
  const reviewCount = profile?.review_count ?? 0
  const initial = nickname.charAt(0).toUpperCase()
  const color = levelColors[level] ?? '#6366f1'

  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', backgroundColor: 'white', padding: 60,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: color, marginBottom: 24,
      }}>
        <span style={{ fontSize: 56, fontWeight: 700, color: 'white' }}>{initial}</span>
      </div>
      <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        {nickname}
      </div>
      <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color, textTransform: 'capitalize', marginBottom: 16 }}>
        {level}
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: '#6b7280' }}>
        {reviewCount} reviews
      </div>
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 20, color: '#9ca3af' }}>
        Ratings
      </div>
    </div>,
    { ...size }
  )
}
