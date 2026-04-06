import CategoryRanking from '@/components/home/CategoryRanking'

export default async function RankingsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div>
      {children}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="font-display text-xl font-black tracking-tight text-foreground mb-6">
          {locale === 'ko' ? '카테고리별 랭킹' : 'Rankings by Category'}
        </h2>
        <CategoryRanking locale={locale} />
      </div>
    </div>
  )
}
