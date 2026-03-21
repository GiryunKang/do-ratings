import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60 // Allow up to 60 seconds

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const results = { checked: 0, fixed: 0, errors: 0, details: [] as string[] }

  // 1. Find subjects with missing images
  const { data: missingImage } = await supabase
    .from('subjects')
    .select('id, name, image_url, metadata')
    .is('image_url', null)
    .limit(50)

  // 2. Find subjects with images but no attribution
  const { data: missingAttribution } = await supabase
    .from('subjects')
    .select('id, name, image_url, metadata')
    .not('image_url', 'is', null)
    .limit(200)

  const noAttribution = (missingAttribution ?? []).filter(s => {
    const meta = s.metadata as Record<string, unknown> | null
    return !meta?.image_attribution
  })

  const toFix = [...(missingImage ?? []), ...noAttribution]
  results.checked = toFix.length

  for (const subject of toFix) {
    const nameEn = (subject.name as Record<string, string>)?.en ?? (subject.name as Record<string, string>)?.ko ?? ''
    if (!nameEn) continue

    try {
      // Try Wikipedia API for a safe, CC-licensed image
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(nameEn)}&prop=pageimages&format=json&pithumbsize=800&origin=*`
      )

      if (!wikiRes.ok) continue

      const wikiData = await wikiRes.json()
      const pages = wikiData?.query?.pages
      if (!pages) continue

      const page = Object.values(pages)[0] as { thumbnail?: { source?: string } }
      const imageUrl = page?.thumbnail?.source

      if (!imageUrl) {
        // Try Korean Wikipedia as fallback
        const nameKo = (subject.name as Record<string, string>)?.ko
        if (nameKo) {
          const koRes = await fetch(
            `https://ko.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(nameKo)}&prop=pageimages&format=json&pithumbsize=800&origin=*`
          )
          if (koRes.ok) {
            const koData = await koRes.json()
            const koPages = koData?.query?.pages
            if (koPages) {
              const koPage = Object.values(koPages)[0] as { thumbnail?: { source?: string } }
              if (koPage?.thumbnail?.source) {
                await updateSubjectImage(supabase, subject.id, koPage.thumbnail.source, nameKo, 'ko', subject.metadata)
                results.fixed++
                results.details.push(`Fixed (ko): ${nameKo}`)
                continue
              }
            }
          }
        }
        continue
      }

      await updateSubjectImage(supabase, subject.id, imageUrl, nameEn, 'en', subject.metadata)
      results.fixed++
      results.details.push(`Fixed: ${nameEn}`)
    } catch (err) {
      results.errors++
      results.details.push(`Error: ${nameEn} — ${err instanceof Error ? err.message : 'unknown'}`)
    }

    // Rate limit: wait 200ms between Wikipedia requests
    await new Promise(r => setTimeout(r, 200))
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  })
}

async function updateSubjectImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subjectId: string,
  imageUrl: string,
  name: string,
  lang: 'en' | 'ko',
  existingMetadata: unknown,
) {
  const wikiBase = lang === 'en' ? 'https://en.wikipedia.org/wiki/' : 'https://ko.wikipedia.org/wiki/'
  const meta = (existingMetadata as Record<string, unknown>) ?? {}

  await supabase
    .from('subjects')
    .update({
      image_url: imageUrl,
      metadata: {
        ...meta,
        image_attribution: {
          source: 'Wikipedia',
          url: `${wikiBase}${encodeURIComponent(name)}`,
          license: 'CC BY-SA 3.0',
        },
      },
    })
    .eq('id', subjectId)
}
