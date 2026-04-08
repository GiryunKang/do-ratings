import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WeeklyReport from '@/components/user/WeeklyReport'

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
