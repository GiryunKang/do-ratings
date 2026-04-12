import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '탐색 — Do! Ratings!',
  description: '세상 모든 것을 탐색하고 평가하세요',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
