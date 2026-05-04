'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import { Plus, Briefcase, FileSignature, BookmarkMinus, Users, Eye, ArrowRight, Loader2, Store, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useProfile } from '@/lib/use-profile'

export default function ListingsPage() {
  const supabase = createSupabaseClient()
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  
  const [dataLoading, setDataLoading] = useState(true)
  
  const [myDeals, setMyDeals] = useState<any[]>([])
  const [savedDeals, setSavedDeals] = useState<any[]>([])
  const [ndaRequests, setNdaRequests] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      
      setDataLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const role = profile.role
      
      if (role === 'seller') {
         const { data: deals } = await supabase.from('deals').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
         
         const mapped = (deals || []).map((d: any) => ({
           ...d,
           ...(d.ownership_structure || {})
         }));
         setMyDeals(mapped)

         if (mapped && mapped.length > 0) {
           const { data: ndas, error: ndaError } = await supabase.from('nda_requests').select(`
             *,
             deals (title),
             users (full_name)
           `).in('deal_id', mapped.map((d: any) => d.id))
           if (ndaError) console.error("NDA fetch error", ndaError)
           setNdaRequests(ndas || [])
         } else {
           setNdaRequests([])
         }
      } else if (['buyer', 'investor', 'advisor'].includes(role)) {
         const { data: saved } = await supabase.from('saved_deals').select('*, deals(*)').eq('user_id', user.id)
         setSavedDeals(saved?.map((s: any) => s.deals) || [])

         const { data: ndas } = await supabase.from('nda_requests').select('*, deals(title)').eq('buyer_id', user.id)
         setNdaRequests(ndas || [])

         // Fetch some recent deals for them to browse instead of showing empty
         const { data: recentDeals } = await supabase.from('deals').select('*').in('status', ['active']).order('created_at', { ascending: false }).limit(3)
         setMyDeals(recentDeals || [])
      }

      setDataLoading(false)
    }
    if (!profileLoading) {
      loadData()
    }
  }, [profile, profileLoading, supabase])

  const handleNdaAction = async (id: string, newStatus: string) => {
    try {
       const res = await fetch(`/api/nda-requests/${id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus })
       })
       const data = await res.json()
       if (!res.ok) throw new Error(data.error || 'Failed to update NDA')
       
       setNdaRequests(ndaRequests.map(r => r.id === id ? { ...r, status: newStatus } : r))
       toast.success(`NDA Request ${newStatus}`)
    } catch (e: any) {
       toast.error(e.message)
    }
  }

  if (profileLoading || dataLoading) {
    return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-emerald-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  if (!profile) return null

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        
        {/* Seller View */}
        {profile?.role === 'seller' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">My Listings</h1>
              <div className="flex items-center gap-3">
                 <Link href="/deals/create" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20")}><Plus className="w-4 h-4 mr-2" /> Create Listing</Link>
              </div>
            </div>
            
            {myDeals.length === 0 ? (
               <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
                 <Store className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                 <h3 className="text-lg font-medium text-white mb-1">No active listings</h3>
                 <p className="text-zinc-500 mb-4 text-sm">Create your first deal listing to start connecting with buyers.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myDeals.map(deal => (
                  <Link href={`/deals/${deal.id}`} key={deal.id}>
                    <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors h-full group">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                           <Badge variant="outline" className="bg-zinc-950 border-zinc-800 text-zinc-300 capitalize">{deal.status.replace('_', ' ')}</Badge>
                           <span className="flex items-center text-xs text-zinc-500"><Eye className="w-3 h-3 mr-1" /> {deal.view_count || 0}</span>
                        </div>
                        <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors">{deal.title}</CardTitle>
                        <CardDescription className="text-zinc-400 line-clamp-1">{deal.industry} • {deal.ownership_structure?.city ? `${deal.ownership_structure.city}, ` : ''}{deal.ownership_structure?.country || deal.location}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            <h2 className="text-xl font-semibold mt-12 mb-4">NDA Requests Received</h2>
            {ndaRequests.length === 0 ? (
               <p className="text-zinc-500 bg-zinc-900 p-6 rounded-xl border border-zinc-800">No NDA requests yet.</p>
            ) : (
               <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                  {ndaRequests.map(req => (
                     <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                         <p className="font-medium text-white">{req.users?.full_name} <span className="text-zinc-500 text-sm font-normal">requested access to</span> {req.deals?.title}</p>
                         <p className="text-xs text-zinc-500 mt-1">Signed as: <span className="font-mono text-zinc-400">{req.signed_name}</span> • Status: <span className={`capitalize ${req.status === 'pending' ? 'text-amber-500' : req.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`}>{req.status}</span></p>
                       </div>
                       {req.status === 'pending' && (
                         <div className="flex items-center gap-2 shrink-0">
                           <Button size="sm" onClick={() => handleNdaAction(req.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8"><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
                           <Button size="sm" variant="outline" onClick={() => handleNdaAction(req.id, 'rejected')} className="border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400 h-8"><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                         </div>
                       )}
                     </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {/* Buyer View */}
        {['buyer', 'investor', 'advisor'].includes(profile?.role) && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">My Deals</h1>
              <div className="flex items-center gap-3">
                 <Link href="/deals" className={cn(buttonVariants({ variant: "outline" }), "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white")}>Browse Deals <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Saved Deals */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center"><BookmarkMinus className="w-5 h-5 mr-2 text-emerald-500" /> Saved Deals</h3>
                {savedDeals.length === 0 ? (
                   <EmptyState
                     icon="🔖"
                     title="No saved deals yet"
                     description="Browse deals and bookmark the ones that interest you."
                     action={{ label: "Browse Deals", href: "/deals" }}
                   />
                ) : (
                  <div className="space-y-3">
                     {savedDeals.map(deal => deal && (
                        <Link href={`/deals/${deal.id}`} key={deal.id}>
                           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-emerald-500/50 transition-colors">
                              <h4 className="font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">{deal.title}</h4>
                              <p className="text-xs text-zinc-400">{deal.industry} • {deal.location}</p>
                           </div>
                        </Link>
                     ))}
                  </div>
                )}
              </div>

              {/* NDA Requests */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center"><FileSignature className="w-5 h-5 mr-2 text-amber-500" /> Active NDAs</h3>
                {ndaRequests.length === 0 ? (
                   <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500 text-sm">
                     You haven&apos;t requested any NDAs yet.
                   </div>
                ) : (
                  <div className="space-y-3">
                     {ndaRequests.map(req => (
                        <Link href={`/deals/${req.deal_id}`} key={req.id}>
                           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-white mb-1">{req.deals?.title}</h4>
                                <p className="text-xs text-zinc-400">Requested on {new Date(req.signed_at).toLocaleDateString()}</p>
                              </div>
                              <Badge variant="outline" className={`capitalize ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                {req.status}
                              </Badge>
                           </div>
                        </Link>
                     ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended / Recent Deals to browse */}
            <div className="mt-12">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">Recommended Opportunities</h2>
               </div>
               
               {myDeals.length === 0 ? (
                 <div className="text-center py-8">
                    <p className="text-zinc-500 text-sm">No recent deals found.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {myDeals.map(deal => (
                      <Link href={`/deals/${deal.id}`} key={`rec-${deal.id}`}>
                        <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors h-full group">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                               <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 capitalize">{deal.deal_type}</Badge>
                            </div>
                            <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors line-clamp-1">{deal.title}</CardTitle>
                            <CardDescription className="text-zinc-400 line-clamp-1">{deal.industry} • {deal.location}</CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
