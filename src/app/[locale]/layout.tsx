import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { AuthProvider } from '@/lib/hooks/AuthProvider'
import Link from 'next/link'
import LocaleAttributes from '@/components/layout/LocaleAttributes'
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
    openGraph: { title, description, url: `https://do-ratings.com/${locale}`, siteName: 'Do! Ratings!', type: 'website', locale: locale === 'ko' ? 'ko_KR' : 'en_US', images: [{ url: 'https://do-ratings.com/og-default.png', width: 1200, height: 630, alt: 'Do! Ratings!' }] },
    twitter: { card: 'summary_large_image', title, description, images: ['https://do-ratings.com/og-default.png'] },
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
        <AuthProvider>
          <LocaleAttributes locale={locale} />
          <a href="#main-content" className="skip-link">{locale === 'ko' ? '본문으로 이동' : 'Skip to content'}</a>
          <Header />
          <Sidebar locale={locale} />
          <div className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:ml-56 lg:pb-0">
            <main id="main-content" tabIndex={-1} className="app-canvas min-h-[calc(100dvh-4rem)] outline-none">{children}</main>
            <footer className="app-canvas flex flex-wrap items-center gap-x-5 border-t border-border px-5 py-6 text-xs text-muted-foreground">
              <span className="mr-auto py-3">DO! RATINGS!</span>
              {[['about', '서비스 소개', 'About'], ['terms', '이용약관', 'Terms'], ['privacy', '개인정보처리방침', 'Privacy']].map(([route, ko, en]) => <Link key={route} href={`/${locale}/${route}`} className="flex min-h-11 items-center hover:text-foreground">{locale === 'ko' ? ko : en}</Link>)}
            </footer>
          </div>
          <BottomNav />
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
