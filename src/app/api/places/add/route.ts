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

// Global daily Google API call limit
const DAILY_LIMIT = 500
let dailyCalls = { count: 0, resetAt: Date.now() + 86400000 }
function checkDailyLimit(): boolean {
  const now = Date.now()
  if (now > dailyCalls.resetAt) { dailyCalls = { count: 0, resetAt: now + 86400000 }; }
  if (dailyCalls.count >= DAILY_LIMIT) return false
  dailyCalls.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 10, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

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

  if (name.length > 500) return NextResponse.json({ error: 'name too long' }, { status: 400 })

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

  // Try to fetch an image (non-blocking — NEVER fail the request if image fetch fails)
  let imageUrl: string | null = null
  let imageAttribution: { source: string; photographer?: string; url?: string; license?: string } | null = null

  try {
  const apiKey = checkDailyLimit() ? process.env.GOOGLE_PLACES_API_KEY : null

  // 1. Try Google Places Photos (for places with photo data)
  if (apiKey && google_place_id) {
    try {
      // Fetch place details to get photos
      // Google Places API (New) returns IDs like "places/ChIJ..." from search,
      // but the details endpoint needs just the ID without the "places/" prefix
      const placeId = google_place_id.startsWith('places/') ? google_place_id.slice(7) : google_place_id
      const detailsRes = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
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
            const googleImageUrl = photoRes.url  // The final redirected URL is the image
            // Download the image and upload to Supabase Storage for permanence
            try {
              const imageResponse = await fetch(googleImageUrl)
              if (imageResponse.ok) {
                const imageBlob = await imageResponse.blob()
                const fileName = `subjects/${newSubject.id}.jpg`

                const { error: uploadError } = await supabase.storage
                  .from('review-images')
                  .upload(fileName, imageBlob, {
                    contentType: imageBlob.type || 'image/jpeg',
                    upsert: true,
                  })

                if (!uploadError) {
                  const { data: publicUrl } = supabase.storage
                    .from('review-images')
                    .getPublicUrl(fileName)
                  imageUrl = publicUrl.publicUrl
                } else {
                  // Fallback to Google URL if upload fails
                  imageUrl = googleImageUrl
                }
              }
            } catch {
              // Fallback to Google URL
              imageUrl = googleImageUrl
            }

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
          const page = Object.values(pages)[0] as { thumbnail?: { source: string } } | undefined
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
  } catch (imgErr) {
    console.error('Image fetch error (non-fatal):', imgErr)
    // Image fetch failed but subject was created successfully — continue
  }

  return NextResponse.json({ id: newSubject.id, existing: false })
}
