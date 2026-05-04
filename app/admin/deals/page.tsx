'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deals')
      .select('*, users (full_name, email)')
      .order('created_at', { ascending: false })
    
    if (data) setDeals(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  const handleAction = async (dealId: string, sellerId: string, title: string, action: string) => {
    try {
      let updateData = {}
      let notifParams = null

      if (action === 'approve') {
        updateData = { status: 'active' }
        notifParams = { 
          type: 'deal_approved', 
          title: 'Deal Approved', 
          body: `Your deal "${title}" has been approved and is now live.`, 
          emailData: { dealTitle: title, url: `${process.env.NEXT_PUBLIC_APP_URL}/deals/${dealId}` } 
        }
      } else if (action === 'reject') {
        updateData = { status: 'draft' } // Send back to draft
        notifParams = { 
          type: 'kyc_updated', // Reuse simple text notification
          title: 'Deal Rejected', 
          body: `Your deal "${title}" was not approved. Please review our guidelines.` 
        }
      }

      if (Object.keys(updateData).length > 0) {
        const res = await fetch(`/api/admin/deals/${dealId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update deal')
        
        toast.success(`Deal ${action}d successfully`)
        fetchDeals()

        if (notifParams) {
          await fetch('/api/admin/notify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId: sellerId, ...notifParams })
          })
        }
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Deal Moderation</h1>
        <p className="text-zinc-400">Review and approve listings before they go live on the platform.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : deals.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden py-8">
          <EmptyState
            icon="✅"
            title="No deals pending review"
            description="All deals have been reviewed."
          />
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Deal</th>
                    <th className="px-6 py-4 font-medium">Seller</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-200 flex items-center gap-2">
                           {deal.title}
                           <Link href={`/deals/${deal.id}`} target="_blank" className="text-indigo-400 hover:text-indigo-300">
                             <ExternalLink className="w-3.5 h-3.5" />
                           </Link>
                        </div>
                        <div className="text-xs text-zinc-500">{deal.industry}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-300">{deal.users?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{deal.users?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-zinc-300">
                        ${(deal.asking_price / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-6 py-4">
                         <Badge variant="outline" className={
                          deal.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          deal.status === 'draft' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : 
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }>
                          {deal.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                         {deal.status !== 'active' && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-8 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300"
                             onClick={() => handleAction(deal.id, deal.seller_id, deal.title, 'approve')}
                           >
                             <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                           </Button>
                         )}
                         {deal.status !== 'draft' && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-8 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
                             onClick={() => handleAction(deal.id, deal.seller_id, deal.title, 'reject')}
                           >
                             <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                           </Button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  )
}
