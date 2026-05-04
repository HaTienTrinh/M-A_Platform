import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { requireDealParticipant } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId, dealTitle, buyerId, sellerId, partnerId, valuation, equityPct, conditions, message, parentOfferId } = body;

    const { error: authError, user, supabase } = await requireDealParticipant(dealId);
    if (authError || !user || !supabase) return authError;

    // Insert offer
    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
         deal_id: dealId,
         submitter_id: user.id,
         seller_id: sellerId,
         buyer_id: buyerId,
         valuation,
         equity_pct: equityPct,
         conditions,
         message,
         parent_offer_id: parentOfferId || null,
         status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    
    // System message
    await supabase.from('messages').insert({
      deal_id: dealId,
      sender_id: user.id,
      content: `Submitted a new offer: Valuation $${valuation.toLocaleString()} for ${equityPct}% equity.`,
      msg_type: 'system'
    });

    // If counter offer, maybe mark parent as countered
    if (parentOfferId) {
       await supabase.from('offers').update({ status: 'countered' }).eq('id', parentOfferId);
    }
    
    if (partnerId && dealTitle) {
      const isCounter = !!parentOfferId;
      await createNotification({
         userId: partnerId,
         type: isCounter ? 'new_offer_response' : 'new_offer',
         title: isCounter ? 'Counter Offer Received' : 'New Offer Received',
         body: `You have received a ${isCounter ? 'counter ' : ''}offer for ${dealTitle}`,
         dealId,
         emailData: {
            type: isCounter ? 'new_offer_response' : 'new_offer',
            data: {
               dealTitle,
               url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/deals/${dealId}/negotiate` : `http://localhost:3000/deals/${dealId}/negotiate`
            }
         }
      });
    }

    return NextResponse.json({ offer });
  } catch (err: any) {
    console.error('Offers API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
