import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)
  const intlResponse = intlMiddleware(request)

  // Merge Supabase auth cookies into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  matcher: ['/', '/(ko|en)/:path*'],
}
