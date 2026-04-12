import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WeeklyReport from '@/components/user/WeeklyReport'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? '주간 리포트 — Do! Ratings!' : 'Weekly Report — Do! Ratings!',
    description: locale === 'ko'
      ? '이번 주 나의 리뷰 활동과 통계를 확인하세요.'
      : 'Check your review activity and stats for this week.',
  }
}

export default async function WeeklyReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <WeeklyReport locale={locale} />
    </div>
  )
}
