import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error: authError, user, supabase } = await requireAuth();
    if (authError || !user || !supabase) return authError;

    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected'].includes(status)) {
       return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify user owns the deal
    const { data: ndaRequest } = await supabase
       .from('nda_requests')
       .select('*, deals(title, seller_id)')
       .eq('id', id)
       .single();

    if (!ndaRequest || ndaRequest.deals.seller_id !== user.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update
    const { data, error } = await supabase
       .from('nda_requests')
       .update({ status })
       .eq('id', id)
       .select()
       .single();

    if (error) throw error;

    // Notify buyer
    if (status === 'approved') {
       const frontendUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
       await createNotification({
         userId: ndaRequest.buyer_id,
         type: 'nda_approved',
         title: 'NDA Approved',
         body: `Your NDA for ${ndaRequest.deals.title} has been approved.`,
         dealId: ndaRequest.deal_id,
         emailData: { dealTitle: ndaRequest.deals.title, url: `${frontendUrl}/deals/${ndaRequest.deal_id}` }
       })
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('NDA Action Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
