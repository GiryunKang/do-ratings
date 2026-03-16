import Link from 'next/link'
import TrendingSubjects from '@/components/home/TrendingSubjects'
import CategoryRanking from '@/components/home/CategoryRanking'

const homeText = {
  ko: {
    heroTitle: '발견하고, 리뷰하고, 공유하세요',
    heroSubtitle: '당신의 의견이 중요합니다. 무엇이든 평가하고, 모두에게 도움을 주세요.',
    exploreCta: '탐색하기',
  },
  en: {
    heroTitle: 'Discover. Review. Share.',
    heroSubtitle: 'Your voice matters. Rate anything, help everyone.',
    exploreCta: 'Explore Now',
  },
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = homeText[locale as 'ko' | 'en'] ?? homeText.en

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-b-3xl px-6 py-14 mb-2 overflow-hidden">
        {/* Floating stars decoration */}
        <span
          className="absolute top-6 left-8 text-white/30 text-2xl animate-float"
          style={{ animationDelay: '0s' }}
          aria-hidden="true"
        >
          ★
        </span>
        <span
          className="absolute top-12 right-16 text-white/20 text-3xl animate-float"
          style={{ animationDelay: '0.8s' }}
          aria-hidden="true"
        >
          ★
        </span>
        <span
          className="absolute bottom-8 left-1/3 text-white/25 text-xl animate-float"
          style={{ animationDelay: '1.6s' }}
          aria-hidden="true"
        >
          ★
        </span>

        {/* Content */}
        <div className="relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-8 max-w-md mx-auto">
            {t.heroSubtitle}
          </p>
          <Link
            href={`/${locale}/explore`}
            className="inline-block bg-white text-indigo-600 font-bold px-6 py-3 rounded-full hover:shadow-lg transition-all hover:scale-105"
          >
            {t.exploreCta}
          </Link>
        </div>
      </section>

      <TrendingSubjects locale={locale} />
      <CategoryRanking locale={locale} />
    </div>
  )
}
