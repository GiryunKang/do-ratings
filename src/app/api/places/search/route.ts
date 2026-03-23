import { NextResponse, type NextRequest } from 'next/server'

interface GooglePlacePhoto {
  name?: string
}

interface GooglePlaceLocation {
  latitude?: number
  longitude?: number
}

interface GooglePlaceDisplayName {
  text?: string
}

interface GooglePlace {
  id: string
  displayName?: GooglePlaceDisplayName
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  types?: string[]
  location?: GooglePlaceLocation
  photos?: GooglePlacePhoto[]
}

interface GooglePlacesSearchResponse {
  places?: GooglePlace[]
}

const rateLimit = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + 60000 }); return true }
  if (entry.count >= 20) return false
  entry.count++; return true
}

// Global daily Google API call limit (prevent billing surprises)
const DAILY_LIMIT = 500
let dailyCalls = { count: 0, resetAt: Date.now() + 86400000 }
function checkDailyLimit(): boolean {
  const now = Date.now()
  if (now > dailyCalls.resetAt) { dailyCalls = { count: 0, resetAt: now + 86400000 }; }
  if (dailyCalls.count >= DAILY_LIMIT) return false
  dailyCalls.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  if (!checkDailyLimit()) return NextResponse.json({ error: 'Daily API limit reached. Please try again tomorrow.' }, { status: 429 })
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? '' // 'restaurant' or empty for general places

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  if (query.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  // Use Google Places API (New) - Text Search
  const url = `https://places.googleapis.com/v1/places:searchText`

  // For restaurants, append 맛집/음식점 for better Korean local search
  const enhancedQuery = type === 'restaurant' ? `${query} 음식점` : query

  const body: Record<string, unknown> = {
    textQuery: enhancedQuery,
    languageCode: 'ko',
    maxResultCount: 10,
    locationBias: {
      rectangle: {
        low: { latitude: 33.0, longitude: 124.5 },
        high: { latitude: 38.6, longitude: 131.9 },
      },
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,places.photos',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Google Places API error:', error)
    return NextResponse.json({ error: 'Failed to search places' }, { status: 500 })
  }

  const data = (await response.json()) as GooglePlacesSearchResponse

  const results = (data.places ?? []).map((place) => ({
    google_place_id: place.id,
    name: place.displayName?.text ?? '',
    address: place.formattedAddress ?? '',
    rating: place.rating ?? null,
    user_ratings_total: place.userRatingCount ?? 0,
    types: place.types ?? [],
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    photo_reference: place.photos?.[0]?.name ?? null,
  }))

  return NextResponse.json({ results })
}
