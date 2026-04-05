'use client'

import Link from 'next/link'

interface HeroBannerProps {
  locale: string
}

export default function HeroBanner({ locale }: HeroBannerProps) {
  return (
    <section className="bg-card border border-border p-12 lg:p-20">
      <div className="max-w-2xl">
        <h1
          className="font-serif text-5xl lg:text-6xl text-foreground mb-6 tracking-tighter leading-none"
          style={{ whiteSpace: 'pre-line' }}
        >
          {locale === 'ko' ? '세상 모든 것을\n평가하는 곳.' : 'Rate Everything\nin the World.'}
        </h1>
        <p className="text-base max-w-[65ch] text-muted-foreground mb-10 leading-relaxed">
          {locale === 'ko'
            ? '항공사부터 맛집까지. 당신의 경험이 누군가의 선택을 바꿉니다.'
            : "From airlines to restaurants. Your experience changes someone's choice."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/explore`}
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {locale === 'ko' ? '탐색하기' : 'Explore'} →
          </Link>
          <Link
            href={`/${locale}/auth/signup`}
            className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-4 text-sm font-semibold hover:bg-muted transition-colors"
          >
            {locale === 'ko' ? '무료 가입' : 'Sign up free'}
          </Link>
        </div>
      </div>
    </section>
  )
}
