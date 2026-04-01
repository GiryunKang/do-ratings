import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSVG } from '@/lib/quiver'

const rateLimit = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + windowMs }); return true }
  if (entry.count >= limit) return false
  entry.count++; return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 5, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { type, prompt, instructions } = body as {
    type: 'icon' | 'badge' | 'illustration' | 'custom'
    prompt: string
    instructions?: string
  }

  if (!prompt || prompt.length > 500) {
    return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
  }

  const styleInstructions: Record<string, string> = {
    icon: 'Minimal flat icon style. Single color with clean lines. 24x24 viewBox. Simple geometric shapes.',
    badge: 'Badge/medal style with a shield or circular frame. Rich detail, metallic look. 64x64 viewBox.',
    illustration: 'Flat illustration style with soft colors. Clean, modern, friendly. 200x200 viewBox.',
    custom: instructions ?? '',
  }

  try {
    const svgs = await generateSVG({
      prompt,
      instructions: styleInstructions[type] ?? styleInstructions.custom,
      count: 1,
      temperature: type === 'icon' ? 0.5 : 0.8,
    })

    if (svgs.length === 0) {
      return NextResponse.json({ error: 'No SVG generated' }, { status: 500 })
    }

    return NextResponse.json({ svg: svgs[0] })
  } catch (e) {
    console.error('Quiver AI error:', e)
    return NextResponse.json({ error: 'SVG generation failed' }, { status: 500 })
  }
}
