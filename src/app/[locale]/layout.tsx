import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import AdBanner from '@/components/layout/AdBanner'
import '../globals.css'

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

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
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        {adsenseClientId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="flex">
            {/* Sidebar with AdBanner below categories — desktop only */}
            <div className="hidden md:block w-64 shrink-0">
              <Sidebar locale={locale} />
              <div className="fixed left-0 top-14 w-64" style={{ top: 'auto', bottom: 0, left: 0 }}>
                {/* AdBanner desktop part is self-contained inside AdBanner */}
              </div>
            </div>
            <main className="flex-1 min-h-screen pb-20 md:pb-0 md:ml-64">
              {children}
            </main>
          </div>
          <AdBanner />
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
