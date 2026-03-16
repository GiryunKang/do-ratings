import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('common')
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">{t('appName')}</h1>
      <p className="mt-4 text-gray-500">Universal Review Platform</p>
    </main>
  )
}
