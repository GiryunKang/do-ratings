import TrendingSubjects from '@/components/home/TrendingSubjects'
import CategoryRanking from '@/components/home/CategoryRanking'

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="max-w-2xl mx-auto">
      <TrendingSubjects locale={locale} />
      <CategoryRanking locale={locale} />
    </div>
  )
}
