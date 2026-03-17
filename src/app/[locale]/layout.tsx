import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import RightSidebar from '@/components/layout/RightSidebar'
import AdBanner from '@/components/layout/AdBanner'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import OnboardingTrigger from '@/components/onboarding/OnboardingTrigger'

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
        <Header />
        <div className="flex">
          <div className="hidden md:block w-64 shrink-0">
            <Sidebar locale={locale} />
          </div>
          <main className="flex-1 min-h-screen pb-20 md:pb-0 md:ml-64 lg:mr-72 bg-gradient-to-b from-gray-50/80 to-white">
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
