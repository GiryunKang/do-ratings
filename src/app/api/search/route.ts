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

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const ratingMin = searchParams.get('rating_min')

  const supabase = await createClient()

  let query = supabase.from('subjects').select('*, categories(name, slug)')

  if (q) {
    query = query.or(`name->ko.ilike.%${q}%,name->en.ilike.%${q}%`)
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
}
