import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '컬렉션 — Do! Ratings!',
  description: '나만의 평가 컬렉션',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
