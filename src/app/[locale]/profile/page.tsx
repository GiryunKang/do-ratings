import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'ko' ? '프로필 — Do! Ratings!' : 'Profile — Do! Ratings!',
    description: locale === 'ko'
      ? '나의 리뷰 활동과 프로필을 확인하세요.'
      : 'View your review activity and profile.',
  }
}

export default async function ProfileRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/${locale}/profile/${user.id}`)
  } else {
    redirect(`/${locale}/auth/login`)
  }
}
