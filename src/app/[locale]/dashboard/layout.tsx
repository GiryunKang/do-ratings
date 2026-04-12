import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? '대시보드 — Do! Ratings!' : 'Dashboard — Do! Ratings!',
    description: locale === 'ko' ? '나의 평가 현황' : 'My review activity',
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
