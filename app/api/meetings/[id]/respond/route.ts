import { NextRequest, NextResponse } from 'next/server';
import { createMeetingEvent, getClientForUser } from '@/lib/google-calendar';
import { createNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/api-auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: meetingId } = await params;
    const { error: authError, user, supabase } = await requireAuth();
    if (authError || !user || !supabase) return authError;

    const body = await req.json();
    const { response } = body; // 'accepted' or 'declined'
    
    // Fetch meeting & attendees
    const { data: meeting, error: meetingErr } = await supabase
      .from('meetings')
      .select('*, meeting_attendees(*)')
      .eq('id', meetingId)
      .single();

    if (meetingErr || !meeting) throw new Error('Meeting not found');

    const attendeeRecord = meeting.meeting_attendees.find((a: any) => a.user_id === user.id);
    if (!attendeeRecord) {
       return NextResponse.json({ error: 'Not an attendee' }, { status: 403 });
    }

    // Update attendee response
    await supabase
      .from('meeting_attendees')
      .update({ response })
      .eq('id', attendeeRecord.id);

    let newMeetingStatus = meeting.status;
    let meetLink = meeting.google_meet_link;
    let eventId = meeting.calendar_event_id;

    if (response === 'accepted') {
      newMeetingStatus = 'confirmed';
      
      // Try to create Google Calendar event if either the proposer or the acceptor has an integration
      // We check the proposer first as they are the primary host, then the current user
      const proposerId = meeting.proposer_id;
      
      let oauth2Client = await getClientForUser(supabase, proposerId);
      if (!oauth2Client && user.id !== proposerId) {
        oauth2Client = await getClientForUser(supabase, user.id);
      }
        
      if (oauth2Client) {
         try {
           const startTime = new Date(meeting.scheduled_at);
           const endTime = new Date(startTime.getTime() + meeting.duration_mins * 60000);
           
           // Fetch emails
           const allAttendeeIds = meeting.meeting_attendees.map((a: any) => a.user_id);
           const { data: usersInfo } = await supabase.from('users').select('email').in('id', allAttendeeIds);
           const emails = usersInfo?.map(u => u.email) || [];

           const gRes = await createMeetingEvent(oauth2Client, {
              title: meeting.title,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              attendees: emails,
              isMeetRequired: meeting.format === 'video'
           });
           
           meetLink = gRes.meetLink;
           eventId = gRes.eventId;
         } catch(e) {
           console.error("Failed to create GCal event", e);
         }
      }
      
      // System message
      await supabase.from('messages').insert({
        deal_id: meeting.deal_id,
        sender_id: user.id,
        content: `Accepted meeting: "${meeting.title}"${meetLink ? `\nLink: ${meetLink}` : ''}`,
        msg_type: 'system'
      });
      
    } else if (response === 'declined') {
      newMeetingStatus = 'cancelled';
      await supabase.from('messages').insert({
        deal_id: meeting.deal_id,
        sender_id: user.id,
        content: `Declined meeting: "${meeting.title}"`,
        msg_type: 'system'
      });
    }

    // Update meeting
    const { data: updatedMeeting, error } = await supabase
      .from('meetings')
      .update({
         status: newMeetingStatus,
         google_meet_link: meetLink,
         calendar_event_id: eventId,
         updated_at: new Date().toISOString()
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;

    // Send notification
    const partnerId = meeting.proposer_id === user.id 
       ? meeting.meeting_attendees.find((a: any) => a.user_id !== user.id)?.user_id 
       : meeting.proposer_id;
       
    const { data: deal } = await supabase.from('deals').select('title').eq('id', meeting.deal_id).single();
    const dealTitle = deal?.title || 'Unknown Deal';

    if (partnerId) {
      await createNotification({
         userId: partnerId,
         type: 'meeting_updated',
         title: `Meeting ${response === 'accepted' ? 'Accepted' : 'Declined'}`,
         body: `The meeting "${meeting.title}" in ${dealTitle} was ${response}.`,
         dealId: meeting.deal_id,
         emailData: {
            type: 'meeting_updated',
            data: {
               dealTitle,
               url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/deals/${meeting.deal_id}/negotiate` : `http://localhost:3000/deals/${meeting.deal_id}/negotiate`
            }
         }
      });
    }

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (err: any) {
    console.error('Meetings Respond API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
