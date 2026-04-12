import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? '비교 — Do! Ratings!' : 'Compare — Do! Ratings!',
    description: locale === 'ko' ? '주제 비교 분석' : 'Compare topics side by side',
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
