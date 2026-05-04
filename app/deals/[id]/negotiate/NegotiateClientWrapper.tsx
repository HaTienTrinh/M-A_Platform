'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChatThread } from '@/components/negotiate/ChatThread'
import { OfferHistory } from '@/components/negotiate/OfferHistory'
import { OfferForm } from '@/components/negotiate/OfferForm'
import { MeetingList } from '@/components/negotiate/MeetingList'
import { MeetingScheduler } from '@/components/negotiate/MeetingScheduler'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Handshake, Calendar as CalendarIcon } from 'lucide-react'

interface Props {
  dealId: string;
  dealTitle: string;
  userId: string;
  userFullName: string;
  buyerId: string;
  sellerId: string;
  partnerId: string;
  partnerName: string;
  isSeller: boolean;
}

export default function NegotiateClientWrapper({ dealId, dealTitle, userId, userFullName, buyerId, sellerId, partnerId, partnerName, isSeller }: Props) {
  const supabase = createSupabaseClient()
  const [offers, setOffers] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'offers' | 'meetings'>('offers')
  const [showScheduler, setShowScheduler] = useState(false)
  const [hasGoogleIntegration, setHasGoogleIntegration] = useState(false)
  
  const checkIntegration = useCallback(async () => {
    const { data } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()
    if (data) setHasGoogleIntegration(true)
  }, [supabase, userId])

  const fetchOffers = useCallback(async () => {
    const { data } = await supabase
      .from('offers')
      .select('*, submitter:users!submitter_id(full_name, email)')
      .eq('deal_id', dealId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      
    if (data) {
      setOffers(data)
    }
  }, [supabase, dealId, buyerId, sellerId])

  const fetchMeetings = useCallback(async () => {
    const { data } = await supabase
      .from('meetings')
      .select('*, meeting_attendees(*)')
      .eq('deal_id', dealId)
      .order('scheduled_at', { ascending: false })
      
    if (data) {
      setMeetings(data)
    }
  }, [supabase, dealId])

  useEffect(() => {
    fetchOffers()
    fetchMeetings()
    checkIntegration()
  }, [fetchOffers, fetchMeetings, checkIntegration])

  return (
    <div className="flex w-full h-full text-zinc-300">
       <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800">
           {/* Chat Appears Here */}
           <ChatThread 
             dealId={dealId} 
             dealTitle={dealTitle}
             userId={userId} 
             partnerId={partnerId}
             partnerName={partnerName} 
             isSeller={isSeller}
           />
       </div>
       
       <div className="w-[400px] shrink-0 bg-zinc-950 flex flex-col h-full overflow-hidden">
          {/* Tabs header */}
          <div className="flex border-b border-zinc-800 shrink-0">
             <button 
               onClick={() => { setActiveTab('offers'); setShowScheduler(false); }}
               className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'offers' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               <Handshake className="w-4 h-4" /> Offers
             </button>
             <button 
               onClick={() => { setActiveTab('meetings'); setSelectedOffer(null); }}
               className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'meetings' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               <CalendarIcon className="w-4 h-4" /> Meetings
             </button>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar p-0">
             {activeTab === 'offers' ? (
                <>
                  <OfferHistory 
                    offers={offers} 
                    userId={userId} 
                    onReply={(offer) => setSelectedOffer(offer)}
                    onOffersUpdated={fetchOffers}
                  />
                  
                  <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 mt-4 h-full">
                    <OfferForm 
                      dealId={dealId}
                      dealTitle={dealTitle}
                      buyerId={buyerId}
                      sellerId={sellerId}
                      partnerId={partnerId}
                      parentOffer={selectedOffer}
                      onCancel={() => setSelectedOffer(null)}
                      onSuccess={() => {
                        setSelectedOffer(null)
                        fetchOffers()
                      }}
                    />
                  </div>
                </>
             ) : (
                <>
                  <MeetingList 
                    meetings={meetings}
                    userId={userId}
                    onMeetingsUpdated={fetchMeetings}
                    onProposeNew={() => setShowScheduler(true)}
                    hasGoogleIntegration={hasGoogleIntegration}
                  />
                  
                  {showScheduler && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 mt-4 h-full">
                      <MeetingScheduler 
                        dealId={dealId}
                        dealTitle={dealTitle}
                        partnerId={partnerId}
                        onCancel={() => setShowScheduler(false)}
                        onSuccess={() => {
                          setShowScheduler(false)
                          fetchMeetings()
                        }}
                      />
                    </div>
                  )}
                </>
             )}
          </div>
       </div>
    </div>
  )
}
