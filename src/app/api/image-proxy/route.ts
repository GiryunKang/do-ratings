import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_HOSTS = [
  'upload.wikimedia.org',
  'commons.wikimedia.org',
]

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  try {
    const parsed = new URL(url)
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DoRatingsBot/1.0 (https://do-ratings.com; contact@do-ratings.com)',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') ?? 'image/png'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
