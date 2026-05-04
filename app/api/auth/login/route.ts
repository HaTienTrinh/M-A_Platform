// /app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed, retryAfterSeconds } = checkRateLimit(`login:${ip}`)
  
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    )
  }

  // This is a proxy to demonstrate rate limiting. 
  // In a real production app, you might handle the full auth flow here
  // or just use this as a gatekeeper.
  
  return NextResponse.json({ success: true })
}
