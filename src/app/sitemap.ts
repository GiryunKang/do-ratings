import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const locales = ['ko', 'en']
  const staticPages = ['', '/explore', '/rankings', '/compare', '/collections', '/battles', '/discover', '/highlights', '/weekly-report']

  const staticEntries = locales.flatMap(locale =>
    staticPages.map(page => ({
      url: `https://do-ratings.com/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  )

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(500)

  const subjectEntries = locales.flatMap(locale =>
    (subjects ?? []).map(s => ({
      url: `https://do-ratings.com/${locale}/subject/${s.id}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  )

  const { data: categories } = await supabase.from('categories').select('slug')

  const categoryEntries = locales.flatMap(locale =>
    (categories ?? []).map(c => ({
      url: `https://do-ratings.com/${locale}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))
  )

  return [...staticEntries, ...categoryEntries, ...subjectEntries]
}
