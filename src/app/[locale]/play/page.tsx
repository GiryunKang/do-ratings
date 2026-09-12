import type { Metadata } from 'next'
import ExplorerHub from '@/components/game/ExplorerHub'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: locale === 'ko' ? '나의 취향 탐험 — Do! Ratings!' : 'Your taste journey — Do! Ratings!' }
}

export default async function PlayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <ExplorerHub locale={locale} />
}
