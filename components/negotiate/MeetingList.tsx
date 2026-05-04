'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Video, MapPin, Check, X, Loader2, Link as LinkIcon, ExternalLink, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createSupabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props {
  meetings: any[];
  userId: string;
  onMeetingsUpdated: () => void;
  onProposeNew: () => void;
  hasGoogleIntegration: boolean;
}

export function MeetingList({ meetings, userId, onMeetingsUpdated, onProposeNew, hasGoogleIntegration }: Props) {
  const supabase = createSupabaseClient()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRespond = async (meetingId: string, response: 'accepted' | 'declined') => {
    setLoadingId(meetingId)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      })
      if (!res.ok) throw new Error('Failed to update meeting')
      toast.success(`Meeting ${response}`)
      onMeetingsUpdated()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingId(null)
    }
  }

  if (meetings.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 border-b border-zinc-800">
        <Calendar className="w-8 h-8 opacity-50 mx-auto mb-3" />
        <h3 className="font-medium text-zinc-300">No Meetings Scheduled</h3>
        <p className="text-sm mt-1 mb-4">Propose a meeting to discuss face-to-face.</p>
        <Button onClick={onProposeNew} variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white">
          <CalendarPlus className="w-4 h-4 mr-2" /> Propose Meeting
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-zinc-950 py-2 z-10 border-b border-zinc-800 px-2">
        <h3 className="font-semibold text-white">Upcoming Meetings</h3>
        <div className="flex gap-2">
           {!hasGoogleIntegration && (
             <Button 
               size="sm" 
               variant="outline" 
               className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
               onClick={async () => {
                 try {
                   const res = await fetch('/api/google-calendar/connect')
                   const { url } = await res.json()
                   const width = 600
                   const height = 700
                   const left = window.screenX + (window.outerWidth - width) / 2
                   const top = window.screenY + (window.outerHeight - height) / 2
                   window.open(url, 'google_oauth_popup', `width=${width},height=${height},left=${left},top=${top}`)
                 } catch (e) {
                   toast.error("Failed to connect")
                 }
               }}
             >
               <Calendar className="w-3 h-3 mr-1" /> Connect Calendar
             </Button>
           )}
           <Button onClick={onProposeNew} size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
             <CalendarPlus className="w-3 h-3 mr-1" /> Propose
           </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {meetings.map((meeting) => {
           const attendee = meeting.meeting_attendees?.find((a: any) => a.user_id === userId)
           const amIProposer = meeting.proposer_id === userId
           const needsResponse = !amIProposer && attendee?.response === 'pending' && meeting.status === 'proposed'
           
           return (
             <div key={meeting.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-zinc-100 flex items-center gap-2">
                      {meeting.title}
                    </h4>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(meeting.scheduled_at), 'MMM d, h:mm a')}</span>
                      <span>•</span>
                      <span>{meeting.duration_mins} min</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    meeting.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    meeting.status === 'cancelled' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }>
                    {meeting.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4 bg-zinc-950 p-2 rounded-lg border border-zinc-800/50">
                  <span className="flex items-center">
                    {meeting.format === 'video' ? <Video className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> : <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-400" />}
                    {meeting.format === 'video' ? 'Video Call' : 'In Person'}
                  </span>
                  
                  {meeting.google_meet_link && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <a href={meeting.google_meet_link} target="_blank" rel="noreferrer" className="flex items-center text-emerald-400 hover:text-emerald-300 transition-colors">
                        <ExternalLink className="w-3 h-3 mr-1" /> Google Meet
                      </a>
                    </>
                  )}
                </div>
                
                {needsResponse && (
                  <div className="flex gap-2 pt-1">
                     <Button 
                       size="sm" 
                       variant="outline" 
                       className="flex-1 bg-zinc-950 border-emerald-900/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                       onClick={() => handleRespond(meeting.id, 'accepted')}
                       disabled={loadingId !== null}
                     >
                       {loadingId === meeting.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Accept</>}
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       className="flex-1 bg-zinc-950 border-red-900/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                       onClick={() => handleRespond(meeting.id, 'declined')}
                       disabled={loadingId !== null}
                     >
                       {loadingId === meeting.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><X className="w-3.5 h-3.5 mr-1" /> Decline</>}
                     </Button>
                  </div>
                )}
             </div>
           )
        })}
      </div>
    </div>
  )
}
