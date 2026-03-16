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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? '' // 'restaurant' or empty for general places

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  // Use Google Places API (New) - Text Search
  const url = `https://places.googleapis.com/v1/places:searchText`

  const body = {
    textQuery: query,
    languageCode: 'ko',
    maxResultCount: 10,
    ...(type === 'restaurant' ? { includedType: 'restaurant' } : {}),
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
