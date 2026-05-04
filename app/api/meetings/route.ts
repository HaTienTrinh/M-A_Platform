import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { requireDealParticipant } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId, dealTitle, partnerId, title, scheduledAt, durationMins, format } = body;

    const { error: authError, user, supabase } = await requireDealParticipant(dealId);
    if (authError || !user || !supabase) return authError;
    
    // Insert meeting
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
         deal_id: dealId,
         proposer_id: user.id,
         title,
         scheduled_at: scheduledAt,
         duration_mins: durationMins,
         format,
         status: 'proposed'
      })
      .select()
      .single();

    if (error) throw error;

    // Insert attendees (both the proposer and the partner)
    await supabase.from('meeting_attendees').insert([
       { meeting_id: meeting.id, user_id: user.id, response: 'accepted' }, // proposer implicitly accepts
       { meeting_id: meeting.id, user_id: partnerId, response: 'pending' }
    ]);
    
    // System message
    await supabase.from('messages').insert({
      deal_id: dealId,
      sender_id: user.id,
      content: `Proposed a meeting: "${title}" for ${new Date(scheduledAt).toLocaleString()}`,
      msg_type: 'system'
    });

    if (partnerId && dealTitle) {
      await createNotification({
         userId: partnerId,
         type: 'meeting_proposed',
         title: 'Meeting Proposed',
         body: `A new meeting has been proposed for ${dealTitle}`,
         dealId,
         emailData: {
            type: 'meeting_proposed',
            data: {
               dealTitle,
               url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/deals/${dealId}/negotiate` : `http://localhost:3000/deals/${dealId}/negotiate`
            }
         }
      });
    }

    return NextResponse.json({ meeting });
  } catch (err: any) {
    console.error('Meetings API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
