import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '배틀 — Do! Ratings!',
  description: '리뷰 대결',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
