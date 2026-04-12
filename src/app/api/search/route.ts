import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const category = searchParams.get('category')
    const ratingMin = searchParams.get('rating_min')

    if (q.length > 200) return NextResponse.json({ error: 'Query too long' }, { status: 400 })

    if (ratingMin !== null) {
      const rating = parseFloat(ratingMin)
      if (isNaN(rating)) return NextResponse.json({ error: 'Invalid rating_min' }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase.from('subjects').select('*, categories(name, slug)')

    if (q) {
      // JSONB fields need cast to text for ILIKE
      query = query.or(`name->>ko.ilike.%${q}%,name->>en.ilike.%${q}%`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    if (ratingMin) {
      query = query.gte('avg_rating', parseFloat(ratingMin))
    }

    const { data, error } = await query
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(20)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('[search] error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
