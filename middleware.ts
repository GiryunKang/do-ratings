import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './src/i18n/routing'
import { updateSession } from './src/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  // First refresh Supabase session cookies
  const supabaseResponse = await updateSession(request)
  // Then handle next-intl locale routing
  const intlResponse = intlMiddleware(request) as NextResponse

  // Copy Supabase Set-Cookie headers to the intl response so session is preserved
  supabaseResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      intlResponse.headers.append(key, value)
    }
  })

  return intlResponse
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
