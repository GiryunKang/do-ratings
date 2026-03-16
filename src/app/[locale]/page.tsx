import { createClient } from '@/lib/supabase/server'
import FeaturedCarousel from '@/components/home/FeaturedCarousel'
import ReviewFeed from '@/components/home/ReviewFeed'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  // Fetch categories
  const { data: categories } = await supabase.from('categories').select('*').order('slug')
  const cats = categories ?? []

  // Fetch trending subjects (top by review_count, with category info)
  const { data: trendingSubjects } = await supabase
    .from('subjects')
    .select('id, name, avg_rating, review_count, category_id, categories(slug, name, icon)')
    .order('review_count', { ascending: false })
    .limit(8)

  const featured = (trendingSubjects ?? []).map((s) => {
    const cat = Array.isArray(s.categories) ? s.categories[0] : s.categories
    return {
      id: s.id,
      name: s.name as Record<string, string>,
      avg_rating: s.avg_rating as number | null,
      review_count: (s.review_count as number) ?? 0,
      category_slug: (cat as { slug?: string } | null)?.slug ?? '',
      category_name: ((cat as { name?: Record<string, string> } | null)?.name ?? {}) as Record<string, string>,
      category_icon: (cat as { icon?: string } | null)?.icon ?? 'folder',
    }
  })

  const categoryList = cats.map((c) => ({
    id: c.id as string,
    slug: c.slug as string,
    name: c.name as Record<string, string>,
    icon: (c.icon ?? 'folder') as string,
  }))

  // Fetch all subjects to show in empty feed state
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name, avg_rating, review_count, description, category_id, categories(slug, name, icon)')
    .order('created_at', { ascending: false })
    .limit(30)

  const subjectList = (allSubjects ?? []).map((s) => {
    const cat = Array.isArray(s.categories) ? s.categories[0] : s.categories
    return {
      id: s.id as string,
      name: s.name as Record<string, string>,
      description: (s.description ?? undefined) as Record<string, string> | undefined,
      avg_rating: s.avg_rating as number | null,
      review_count: (s.review_count as number) ?? 0,
      category_slug: (cat as { slug?: string } | null)?.slug ?? '',
      category_name: ((cat as { name?: Record<string, string> } | null)?.name ?? {}) as Record<string, string>,
      category_icon: (cat as { icon?: string } | null)?.icon ?? 'folder',
    }
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <FeaturedCarousel subjects={featured} locale={locale} />
      <ReviewFeed categories={categoryList} locale={locale} subjects={subjectList} />
    </div>
  )
}
