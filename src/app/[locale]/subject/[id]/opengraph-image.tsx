import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Subject Rating'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('name, avg_rating, review_count, categories(name, slug)')
    .eq('id', id)
    .single()

  if (!subject) {
    return new ImageResponse(
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f9fafb', fontSize: 48 }}>
        Ratings
      </div>,
      { ...size }
    )
  }

  const name = typeof subject.name === 'object'
    ? ((subject.name as Record<string, string>)[locale] ?? (subject.name as Record<string, string>).en)
    : String(subject.name)

  const cat = Array.isArray(subject.categories) ? subject.categories[0] : subject.categories
  const categoryName = cat
    ? ((cat.name as Record<string, string>)[locale] ?? (cat.name as Record<string, string>).en)
    : ''

  const rating = subject.avg_rating ? Number(subject.avg_rating).toFixed(1) : '—'
  const fullStars = Math.floor(Number(subject.avg_rating ?? 0))
  const hasHalf = (Number(subject.avg_rating ?? 0) - fullStars) >= 0.25

  return new ImageResponse(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', backgroundColor: 'white', padding: 60,
    }}>
      <div style={{ display: 'flex', fontSize: 24, color: '#6366f1', marginBottom: 16, fontWeight: 600 }}>
        {categoryName}
      </div>
      <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 24 }}>
        {name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: 48, color: i < fullStars || (i === fullStars && hasHalf) ? '#f59e0b' : '#d1d5db' }}>
            ★
          </span>
        ))}
        <span style={{ fontSize: 48, fontWeight: 700, color: '#111827', marginLeft: 16 }}>{rating}</span>
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: '#6b7280' }}>
        {subject.review_count} reviews
      </div>
      <div style={{ display: 'flex', position: 'absolute', bottom: 40, fontSize: 20, color: '#9ca3af' }}>
        Ratings
      </div>
    </div>,
    { ...size }
  )
}
