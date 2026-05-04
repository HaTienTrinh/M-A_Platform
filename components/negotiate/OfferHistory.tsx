'use client'

import { format } from 'date-fns'
import { formatBytes } from '@/lib/utils'
import { Check, X, CornerDownRight, Handshake, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { createSupabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
  offers: any[];
  userId: string;
  onReply: (offer: any) => void;
  onOffersUpdated: () => void;
}

export function OfferHistory({ offers, userId, onReply, onOffersUpdated }: Props) {
  const supabase = createSupabaseClient()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRespond = async (offerId: string, status: 'accepted' | 'rejected') => {
    setLoadingId(offerId)
    try {
      const res = await fetch(`/api/offers/${offerId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update offer')
      toast.success(`Offer ${status}`)
      onOffersUpdated()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoadingId(null)
    }
  }

  if (offers.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon="📋"
          title="No offers yet"
          description="Submit an offer on a deal to start negotiating."
          action={{ label: "Browse Deals", href: "/deals" }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-white px-2 sticky top-0 bg-zinc-950 py-2 z-10 border-b border-zinc-800">Offer Timeline</h3>
      
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
        {offers.map(offer => {
           const isMe = offer.submitter_id === userId
           const canRespond = !isMe && offer.status === 'pending'
           
           return (
             <div key={offer.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-1 md:left-1/2 md:-translate-x-1/2">
                   {offer.status === 'accepted' ? <Check className="w-5 h-5 text-emerald-500" /> : 
                    offer.status === 'rejected' ? <X className="w-5 h-5 text-red-500" /> : 
                    offer.status === 'countered' ? <CornerDownRight className="w-5 h-5 text-amber-500" /> : 
                    <Handshake className="w-5 h-5 text-indigo-400" />}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-[4rem] md:ml-0 p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-semibold uppercase text-zinc-500">{isMe ? 'You' : offer.submitter?.full_name || 'Partner'}</span>
                     <Badge variant="outline" className={
                       offer.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                       offer.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                       offer.status === 'countered' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                     }>
                       {offer.status}
                     </Badge>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-3">
                     <div>
                       <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Valuation</div>
                       <div className="font-mono text-zinc-200">${Number(offer.valuation).toLocaleString()}</div>
                     </div>
                     <div>
                       <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Equity</div>
                       <div className="font-mono text-zinc-200">{offer.equity_pct}%</div>
                     </div>
                   </div>
                   
                   {offer.conditions && (
                     <div className="mb-3">
                       <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Conditions</div>
                       <div className="text-xs text-zinc-400">{offer.conditions}</div>
                     </div>
                   )}
                   
                   {offer.message && (
                     <div className="p-2 rounded bg-zinc-950/50 border border-zinc-800 text-xs italic text-zinc-300">
                       &quot;{offer.message}&quot;
                     </div>
                   )}
                   
                   <div className="mt-3 text-[10px] text-zinc-600 text-right">
                     {format(new Date(offer.created_at), 'MMM d, h:mm a')}
                   </div>
                   
                   {/* Actions */}
                   {canRespond && (
                     <div className="mt-4 flex gap-2 border-t border-zinc-800 pt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 bg-zinc-950 border-zinc-700 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                          onClick={() => handleRespond(offer.id, 'accepted')}
                          disabled={loadingId !== null}
                        >
                          {loadingId === offer.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Accept</>}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 bg-zinc-950 border-zinc-700 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30"
                          onClick={() => onReply(offer)}
                        >
                          <CornerDownRight className="w-3.5 h-3.5 mr-1" /> Counter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 bg-zinc-950 border-zinc-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                          onClick={() => handleRespond(offer.id, 'rejected')}
                          disabled={loadingId !== null}
                        >
                          {loadingId === offer.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><X className="w-3.5 h-3.5 mr-1" /> Reject</>}
                        </Button>
                     </div>
                   )}
                </div>
             </div>
           )
        })}
      </div>
    </div>
  )
}
