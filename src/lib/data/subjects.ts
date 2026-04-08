import { unstable_cache } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export const getCachedSubjects = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, avg_rating, review_count, description, category_id, image_url, categories(slug, name, icon)')
      .limit(200)
    if (error) console.error('[getCachedSubjects] error:', error.message)
    return data ?? []
  },
  ['subjects-list'],
  { revalidate: 60 }
)
