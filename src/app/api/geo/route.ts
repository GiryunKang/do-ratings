import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') ?? 'XX'
  return NextResponse.json({ country })
}
