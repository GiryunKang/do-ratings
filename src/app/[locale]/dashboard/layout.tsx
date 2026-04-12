import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '대시보드 — Do! Ratings!',
  description: '나의 평가 현황',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
