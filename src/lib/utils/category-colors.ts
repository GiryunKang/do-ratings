const categoryColors: Record<string, string> = {
  airlines: 'bg-blue-500',
  hotels: 'bg-violet-500',
  restaurants: 'bg-orange-500',
  companies: 'bg-emerald-500',
  places: 'bg-cyan-500',
  people: 'bg-pink-500',
}

export function getCategoryColor(slug: string): string {
  return categoryColors[slug] ?? 'bg-primary'
}

export function getCategoryTextColor(slug: string): string {
  return categoryColors[slug]?.replace('bg-', 'text-') ?? 'text-primary'
}
