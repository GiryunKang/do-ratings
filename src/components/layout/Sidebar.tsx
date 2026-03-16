import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export default async function Sidebar({ locale }: { locale: string }) {
  const supabase = await createClient()
  let categories: Category[] = []

  try {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, icon')
      .order('name', { ascending: true })

    categories = data ?? []
  } catch {
    // Silently fail — categories optional
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Categories
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400 px-2">No categories</p>
        ) : (
          <ul className="space-y-0.5">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/${locale}/category/${cat.slug}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-base w-5 text-center">
                    {cat.icon ?? '📁'}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
