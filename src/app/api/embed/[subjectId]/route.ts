import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params
  const { searchParams } = new URL(request.url)
  const size = searchParams.get('size') ?? 'md'

  const supabase = await createClient()
  const { data: subject } = await supabase
    .from('subjects')
    .select('name, avg_rating, review_count')
    .eq('id', subjectId)
    .single()

  if (!subject) return new NextResponse('Not found', { status: 404 })

  const name =
    typeof subject.name === 'object'
      ? ((subject.name as Record<string, string>).en ??
        (subject.name as Record<string, string>).ko)
      : String(subject.name)

  const rating = subject.avg_rating ? Number(subject.avg_rating).toFixed(1) : '—'
  const roundedRating = Math.round(Number(subject.avg_rating ?? 0))
  const stars = '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating)

  const nameFontSize = size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px'
  const starFontSize = size === 'sm' ? '12px' : size === 'lg' ? '18px' : '14px'
  const metaFontSize = size === 'sm' ? '10px' : '12px'

  const baseUrl = request.url.split('/api')[0]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: transparent; }
    a { text-decoration: none; color: inherit; display: block; height: 100vh; }
    .badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      height: 100%;
      transition: box-shadow 0.15s ease;
    }
    .badge:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .name { font-weight: 600; color: #111827; font-size: ${nameFontSize}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rating-row { display: flex; align-items: center; gap: 4px; }
    .stars { color: #f59e0b; font-size: ${starFontSize}; }
    .score { color: #374151; font-weight: 600; font-size: ${starFontSize}; }
    .meta { color: #6b7280; font-size: ${metaFontSize}; }
  </style>
</head>
<body>
<a href="${baseUrl}/subject/${subjectId}" target="_blank" rel="noopener noreferrer">
  <div class="badge">
    <div>
      <div class="name">${name}</div>
      <div class="rating-row">
        <span class="stars">${stars}</span>
        <span class="score">${rating}</span>
      </div>
      <div class="meta">${subject.review_count} reviews &bull; Ratings</div>
    </div>
  </div>
</a>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'ALLOWALL',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
