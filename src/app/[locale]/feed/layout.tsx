import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '피드 — Do! Ratings!',
  description: '실시간 리뷰 피드',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
