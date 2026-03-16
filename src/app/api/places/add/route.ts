import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { google_place_id, name, address, rating, category_slug, lat, lng } = body

  if (!google_place_id || !name || !category_slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get category ID
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', category_slug)
    .single()

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  // Check if this Google Place already exists as a subject
  const { data: existing } = await supabase
    .from('subjects')
    .select('id')
    .eq('category_id', category.id)
    .contains('metadata', { google_place_id })
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ id: existing.id, existing: true })
  }

  // Insert new subject
  const { data: newSubject, error } = await supabase
    .from('subjects')
    .insert({
      category_id: category.id,
      name: { ko: name, en: name },
      metadata: {
        google_place_id,
        address,
        google_rating: rating,
        lat,
        lng,
      },
    })
    .select('id')
    .single()

  if (error) {
    console.error('Insert error:', error)
    return NextResponse.json({ error: 'Failed to add subject' }, { status: 500 })
  }

  return NextResponse.json({ id: newSubject.id, existing: false })
}
