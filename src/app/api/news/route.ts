import { NextResponse, type NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + 60000 }); return true }
  if (entry.count >= 15) return false
  entry.count++; return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

  if (!query) return NextResponse.json({ articles: [] })

  try {
    // Use Google News RSS feed converted to JSON via a proxy
    const encodedQuery = encodeURIComponent(query)
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ko&gl=KR&ceid=KR:ko`

    const response = await fetch(rssUrl, { next: { revalidate: 600 } }) // cache 10 min
    const xmlText = await response.text()

    // Simple XML parsing for RSS items (no external library needed)
    const items = xmlText.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    const articles = items.slice(0, 5).map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        ?? item.match(/<title>(.*?)<\/title>/)?.[1]
        ?? ''
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]
        ?? item.match(/<link\/>(.*?)(?=<)/)?.[1]
        ?? ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
      const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] ?? ''

      return { title, link, pubDate, source }
    }).filter(a => a.title && a.link)

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json({ articles: [] })
  }
}
