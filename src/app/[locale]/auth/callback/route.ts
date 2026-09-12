import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeReturnTo } from '@/lib/utils/return-to'

export async function GET(request: Request) {
  const { searchParams, origin, pathname } = new URL(request.url)
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'
  const destination = safeReturnTo(searchParams.get('next'), locale)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(destination, origin))
  }

  return NextResponse.redirect(new URL(`/${locale}/auth/login?error=callback&redirect=${encodeURIComponent(destination)}`, origin))
}
