// /lib/api-auth.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null, supabase }
  }
  return { error: null, user, supabase }
}

export async function requireRole(allowedRoles: string[]) {
  const { error, user, supabase } = await requireAuth()
  if (error || !user) return { error, user: null, supabase: null }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
      supabase
    }
  }
  return { error: null, user, supabase }
}

export async function requireDealParticipant(dealId: string) {
  const { error, user, supabase } = await requireAuth()
  if (error || !user) return { error, user: null, supabase: null }

  // 1. Check if user is the seller
  const { data: deal } = await supabase
    .from('deals')
    .select('seller_id')
    .eq('id', dealId)
    .single()

  if (deal?.seller_id === user.id) {
    return { error: null, user, supabase }
  }

  // 2. Check if user is a buyer with approved NDA
  const { data: nda } = await supabase
    .from('nda_requests')
    .select('id')
    .eq('deal_id', dealId)
    .eq('buyer_id', user.id)
    .eq('status', 'approved')
    .single()

  if (nda) {
    return { error: null, user, supabase }
  }

  // 3. Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    return { error: null, user, supabase }
  }

  return {
    error: NextResponse.json({ error: 'Access denied — not a deal participant' }, { status: 403 }),
    user: null,
    supabase
  }
}
