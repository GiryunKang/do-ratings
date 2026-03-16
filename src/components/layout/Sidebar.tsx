import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CategoryIcon } from '@/lib/icons'

interface Category {
  id: string
  name: Record<string, string>
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
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
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
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-50/50 hover:translate-x-0.5 transition-all duration-200"
                >
                  <CategoryIcon name={cat.icon ?? 'folder'} className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="truncate">{cat.name[locale] ?? cat.name['ko']}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
