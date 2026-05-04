// /app/api/nda-requests/route.ts
import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'
import { requireRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { error: authError, user, supabase } = await requireRole(['buyer', 'admin'])
    if (authError || !user || !supabase) return authError

    const body = await request.json()
    const { dealId, signature } = body

    if (!dealId || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('nda_requests')
      .insert({
        deal_id: dealId,
        buyer_id: user.id,
        signed_name: signature,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Fetch deal to get seller_id and title
    const { data: deal } = await supabase.from('deals').select('title, seller_id').eq('id', dealId).single()
    
    if (deal && deal.seller_id) {
       // Also get buyer name
       const { data: buyerProf } = await supabase.from('users').select('full_name').eq('id', user.id).single()
       
       const frontendUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
       await createNotification({
         userId: deal.seller_id,
         type: 'new_buyer_interested',
         title: 'New NDA Request',
         body: `${buyerProf?.full_name || 'A buyer'} requested access to ${deal.title}`,
         dealId,
         emailData: { dealTitle: deal.title, url: `${frontendUrl}/listings` }
       })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

