import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: offerId } = await params;
    const body = await req.json();
    const { status } = body; // 'accepted' or 'rejected'

    const { error: authError, user, supabase } = await requireAuth();
    if (authError || !user || !supabase) return authError;

    // Fetch the offer to check if user is participant
    const { data: offer, error: fetchErr } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (fetchErr || !offer) throw new Error('Offer not found');
    
    if (offer.seller_id !== user.id && offer.buyer_id !== user.id) {
       return NextResponse.json({ error: 'Unauthorized access to offer' }, { status: 403 });
    }

    // Update offer
    const { data: updatedOffer, error } = await supabase
      .from('offers')
      .update({
         status,
         updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;
    
    // System message
    await supabase.from('messages').insert({
      deal_id: offer.deal_id,
      sender_id: user.id,
      content: `Offer ${status === 'accepted' ? 'Accepted ✅' : 'Rejected ❌'}. Valuation $${offer.valuation.toLocaleString()} for ${offer.equity_pct}% equity.`,
      msg_type: 'system'
    });

    const { data: deal } = await supabase.from('deals').select('title').eq('id', offer.deal_id).single();
    const dealTitle = deal?.title || 'Unknown Deal';
    const partnerId = user.id === offer.buyer_id ? offer.seller_id : offer.buyer_id;

    if (partnerId) {
      await createNotification({
         userId: partnerId,
         type: 'new_offer_response',
         title: `Offer ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
         body: `Your offer for ${dealTitle} has been ${status}.`,
         dealId: offer.deal_id,
         emailData: {
            type: 'new_offer_response',
            data: {
               dealTitle,
               url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/deals/${offer.deal_id}/negotiate` : `http://localhost:3000/deals/${offer.deal_id}/negotiate`
            }
         }
      });
    }

    return NextResponse.json({ offer: updatedOffer });
  } catch (err: any) {
    console.error('Offers Respond API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
