import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '비교 — Do! Ratings!',
  description: '주제 비교 분석',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
