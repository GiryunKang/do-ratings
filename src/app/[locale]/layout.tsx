import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import RightSidebar from '@/components/layout/RightSidebar'
import AdBanner from '@/components/layout/AdBanner'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import OnboardingTrigger from '@/components/onboarding/OnboardingTrigger'
import SplashScreen from '@/components/ui/SplashScreen'
import ActivitySummary from '@/components/ui/ActivitySummary'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const title = locale === 'ko' ? 'Do! Ratings! — 세상 모든 것에 별점을' : 'Do! Ratings! — Rate Everything in the World'
  const description = locale === 'ko'
    ? '인물, 기업, 장소, 항공사, 호텔, 레스토랑 등 세상 모든 것을 평가하는 글로벌 리뷰 플랫폼'
    : 'A global review platform to rate everything — people, companies, places, airlines, hotels, restaurants and more'
  return {
    title: { default: title, template: '%s — Do! Ratings!' },
    description,
    keywords: locale === 'ko' ? ['평점', '리뷰', '별점', '평가', '랭킹'] : ['ratings', 'reviews', 'stars', 'ranking', 'rate'],
    openGraph: { title, description, url: `https://do-ratings.com/${locale}`, siteName: 'Do! Ratings!', type: 'website', locale: locale === 'ko' ? 'ko_KR' : 'en_US' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://do-ratings.com/${locale}`, languages: { ko: 'https://do-ratings.com/ko', en: 'https://do-ratings.com/en' } },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'ko' | 'en')) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <SplashScreen locale={locale} />
        <ActivitySummary locale={locale} />
        <ScrollProgressBar />
        <Header />
        <div className="flex">
          <div className="hidden md:block w-64 shrink-0">
            <Sidebar locale={locale} />
          </div>
          <main className="flex-1 min-w-0 min-h-screen pb-20 md:pb-0 lg:mr-72 bg-gradient-to-b from-gray-50/80 to-white">
            {children}
          </main>
          <RightSidebar locale={locale} />
        </div>
        <AdBanner />
        <BottomNav />
        <OnboardingTrigger />
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
