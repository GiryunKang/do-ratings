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

  // Try to fetch an image (non-blocking — don't fail the request if image fetch fails)
  let imageUrl: string | null = null
  let imageAttribution: { source: string; photographer?: string; url?: string; license?: string } | null = null

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // 1. Try Google Places Photos (for places with photo data)
  if (apiKey && google_place_id) {
    try {
      // Fetch place details to get photos
      const detailsRes = await fetch(
        `https://places.googleapis.com/v1/places/${google_place_id}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'photos',
          },
        }
      )
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json()
        const photoName = detailsData.photos?.[0]?.name
        if (photoName) {
          // Google Places Photos API (New) - get media URL
          const photoRes = await fetch(
            `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`,
            { redirect: 'follow' }
          )
          if (photoRes.ok) {
            imageUrl = photoRes.url  // The final redirected URL is the image
            const authorAttribs = detailsData.photos[0].authorAttributions?.[0]
            imageAttribution = {
              source: 'Google',
              photographer: authorAttribs?.displayName ?? 'Google Maps',
              url: authorAttribs?.uri ?? undefined,
              license: 'Google Maps Platform Terms of Service',
            }
          }
        }
      }
    } catch (e) {
      console.error('Google Places photo fetch error:', e)
    }
  }

  // 2. Fallback: Wikipedia API (for any subject, no API key needed)
  if (!imageUrl) {
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=800&origin=*`
      )
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json()
        const pages = wikiData?.query?.pages
        if (pages) {
          const page = Object.values(pages)[0] as any
          if (page?.thumbnail?.source) {
            imageUrl = page.thumbnail.source
            imageAttribution = {
              source: 'Wikipedia',
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`,
              license: 'CC BY-SA 3.0',
            }
          }
        }
      }
    } catch (e) {
      console.error('Wikipedia image fetch error:', e)
    }
  }

  // Update subject with image if found
  if (imageUrl) {
    await supabase
      .from('subjects')
      .update({
        image_url: imageUrl,
        metadata: {
          google_place_id,
          address,
          google_rating: rating,
          lat,
          lng,
          image_attribution: imageAttribution,
        },
      })
      .eq('id', newSubject.id)
  }

  return NextResponse.json({ id: newSubject.id, existing: false })
}
