'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Calendar, X } from 'lucide-react'

interface Props {
  dealId: string;
  dealTitle: string;
  partnerId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function MeetingScheduler({ dealId, dealTitle, partnerId, onCancel, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('Deal Discussion')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('30')
  const [format, setFormat] = useState<'video' | 'in_person'>('video')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) {
      toast.error('Date and time are required')
      return
    }

    setLoading(true)
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString()
      
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          dealTitle,
          partnerId,
          title,
          scheduledAt,
          durationMins: parseInt(duration),
          format
        })
      })
      
      if (!res.ok) throw new Error('Failed to propose meeting')
      toast.success('Meeting proposed')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-emerald-500" /> Propose Meeting
        </h3>
        <Button variant="ghost" size="icon" type="button" className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-400 hover:text-white" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="space-y-4 overflow-auto custom-scrollbar flex-1 pr-1">
         <div>
           <Label className="text-xs text-zinc-400">Meeting Title</Label>
           <Input 
             required 
             value={title} 
             onChange={(e) => setTitle(e.target.value)} 
             className="bg-zinc-950 border-zinc-800 h-9 mt-1" 
           />
         </div>
         
         <div className="grid grid-cols-2 gap-3">
           <div>
             <Label className="text-xs text-zinc-400">Date</Label>
             <Input 
               type="date"
               required 
               value={date} 
               onChange={(e) => setDate(e.target.value)} 
               className="bg-zinc-950 border-zinc-800 h-9 mt-1 block w-full text-white" 
             />
           </div>
           <div>
             <Label className="text-xs text-zinc-400">Time</Label>
             <Input 
               type="time"
               required 
               value={time} 
               onChange={(e) => setTime(e.target.value)} 
               className="bg-zinc-950 border-zinc-800 h-9 mt-1 block w-full text-white appearance-none" 
             />
             <style jsx>{`
               input[type="time"]::-webkit-calendar-picker-indicator {
                 filter: invert(1);
               }
             `}</style>
           </div>
         </div>

         <div className="grid grid-cols-2 gap-3">
           <div>
             <Label className="text-xs text-zinc-400">Duration</Label>
             <select 
               value={duration} 
               onChange={(e) => setDuration(e.target.value)} 
               className="bg-zinc-950 border border-zinc-800 text-white text-sm rounded-md h-9 w-full mt-1 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
             >
               <option value="15">15 min</option>
               <option value="30">30 min</option>
               <option value="45">45 min</option>
               <option value="60">1 hour</option>
               <option value="90">1.5 hours</option>
               <option value="120">2 hours</option>
             </select>
           </div>
           <div>
             <Label className="text-xs text-zinc-400">Format</Label>
             <select 
               value={format} 
               onChange={(e) => setFormat(e.target.value as any)} 
               className="bg-zinc-950 border border-zinc-800 text-white text-sm rounded-md h-9 w-full mt-1 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
             >
               <option value="video">Video Call (Meet)</option>
               <option value="in_person">In Person</option>
             </select>
           </div>
         </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-zinc-800 shrink-0">
        <Button disabled={loading || !date || !time} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Send Proposal'}
        </Button>
      </div>
    </form>
  )
}
