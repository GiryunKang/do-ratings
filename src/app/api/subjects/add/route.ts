import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const rateLimit = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + windowMs }); return true }
  if (entry.count >= limit) return false
  entry.count++; return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 10, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name_ko, name_en, category_slug, description_ko, description_en, image_url } = body

  if (!name_ko && !name_en) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!category_slug) return NextResponse.json({ error: 'Category required' }, { status: 400 })

  if (name_ko && name_ko.length > 200) return NextResponse.json({ error: 'name_ko too long' }, { status: 400 })
  if (name_en && name_en.length > 200) return NextResponse.json({ error: 'name_en too long' }, { status: 400 })
  if (description_ko && description_ko.length > 2000) return NextResponse.json({ error: 'description_ko too long' }, { status: 400 })
  if (description_en && description_en.length > 2000) return NextResponse.json({ error: 'description_en too long' }, { status: 400 })
  if (image_url && !/^https?:\/\//.test(image_url)) return NextResponse.json({ error: 'Invalid image_url' }, { status: 400 })

  const { data: category } = await supabase
    .from('categories').select('id').eq('slug', category_slug).single()
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  const name = { ko: name_ko || name_en, en: name_en || name_ko }

  // Check duplicate
  const { data: existing } = await supabase
    .from('subjects').select('id')
    .eq('category_id', category.id)
    .contains('name', { ko: name.ko })
    .maybeSingle()
  if (existing) return NextResponse.json({ id: existing.id, existing: true })

  // Try Wikipedia image if none provided
  let finalImageUrl = image_url || null
  let imageAttribution: { source: string; url: string; license: string } | null = null
  if (!finalImageUrl) {
    try {
      const searchName = name_en || name_ko
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchName)}&prop=pageimages&format=json&pithumbsize=800&origin=*`
      )
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json()
        const pages = wikiData?.query?.pages
        if (pages) {
          const page = Object.values(pages)[0] as any
          if (page?.thumbnail?.source) {
            finalImageUrl = page.thumbnail.source
            imageAttribution = {
              source: 'Wikipedia',
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(searchName)}`,
              license: 'CC BY-SA 3.0',
            }
          }
        }
      }
    } catch (e) { console.error('Wiki image error:', e) }
  }

  const description = (description_ko || description_en)
    ? { ko: description_ko || '', en: description_en || '' }
    : null

  const { data: newSubject, error } = await supabase
    .from('subjects')
    .insert({
      category_id: category.id,
      name,
      description,
      image_url: finalImageUrl,
      metadata: imageAttribution ? { image_attribution: imageAttribution } : {},
    })
    .select('id')
    .single()

  if (error) {
    console.error('Insert error:', error)
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 })
  }
  return NextResponse.json({ id: newSubject.id, existing: false })
}
