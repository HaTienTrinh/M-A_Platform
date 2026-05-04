// /app/deals/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heart, Building2, MapPin, Briefcase, ChevronLeft, ChevronRight, Eye, Loader2, Share2, Mail } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { FinancialCharts } from '@/components/FinancialCharts'
import { DocumentList } from '@/components/DocumentList'
import { NdaModal } from '@/components/NdaModal'
import { AiSummary } from '@/components/AiSummary'
import { AiMatchScore } from '@/components/AiMatchScore'
import { useProfile } from '@/lib/use-profile'

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const supabase = createSupabaseClient()

  const [deal, setDeal] = useState<any>(null)
  const { profile, loading: profileLoading } = useProfile()
  
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [ndaStatus, setNdaStatus] = useState<string | null>(null)
  
  useEffect(() => {
    async function loadData() {
      // Fetch from our API
      try {
        const res = await fetch(`/api/deals/${dealId}`)
        if (!res.ok) throw new Error('Deal not found')
        const { deal: dealData } = await res.json()
        setDeal(dealData)

        // Check if saved
        if (profile) {
          const { data: savedData } = await supabase
            .from('saved_deals')
            .select('id')
            .eq('deal_id', dealId)
            .eq('user_id', profile.id)
            .single()
            
          setIsSaved(!!savedData)

          // Check NDA status
          const { data: ndaData } = await supabase
            .from('nda_requests')
            .select('status')
            .eq('deal_id', dealId)
            .eq('buyer_id', profile.id)
            .single()

          if (ndaData) {
            setNdaStatus(ndaData.status)
          }

          if (dealData.seller_id === profile.id) {
            setNdaStatus('approved') // Seller always has access
          }
        }
      } catch (e: any) {
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (!profileLoading) {
      loadData()
    }
  }, [dealId, profile, profileLoading, supabase])

  const formatCurrency = (val: number) => {
    if (!val) return 'N/A'
    return `$${(val / 1000000).toFixed(1)}M`
  }

  const handleSaveToggle = async () => {
    if (!profile) {
      router.push('/login')
      return
    }
    setSaving(true)
    try {
      if (isSaved) {
        await supabase.from('saved_deals').delete().eq('deal_id', dealId).eq('user_id', profile.id)
        setIsSaved(false)
        toast.success("Removed from saved deals")
      } else {
        await supabase.from('saved_deals').insert({ deal_id: dealId, user_id: profile.id })
        setIsSaved(true)
        toast.success("Deal saved to bookmarks")
      }
    } catch (e) {
      toast.error("Failed to update save status")
    } finally {
      setSaving(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard")
  }

  const handleRequestNda = async (signature: string) => {
    if (!profile) {
      router.push('/login')
      return
    }
    const res = await fetch('/api/nda-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, signature })
    })
    
    if (res.ok) {
      setNdaStatus('pending')
      toast.success("NDA Request submitted. Waiting for seller approval.")
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to submit request")
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-500">Loading deal securely...</p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-2">Deal Not Found</h1>
        <p className="text-zinc-400 mb-6">The deal you are looking for might be removed or private.</p>
        <Link href="/deals" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-500")}>Return to Deals</Link>
      </div>
    )
  }

  const isUnlocked = ndaStatus === 'approved'

  // Blur sensitive data if locked
  const renderText = (text: string, blurLength = 200) => {
    if (isUnlocked) return text
    if (!text) return ''
    if (text.length <= blurLength) return text
    return (
      <>
        {text.substring(0, blurLength)}
        <span className="blur-[5px] select-none text-zinc-500">{text.substring(blurLength)}</span>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans pb-20">
      {/* Navbar simplified for detail page */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-10 px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href={profile.id === deal.seller_id ? "/listings" : "/deals"} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-zinc-400 hover:text-white -ml-2")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <div className="flex items-center gap-2">
            {profile.id === deal.seller_id && (
               <Link href={`/deals/${deal.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white mr-2")}>
                 Edit Deal
               </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleShare} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveToggle} disabled={saving} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 group">
              <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-400 group-hover:text-emerald-400'}`} />
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        {/* Deal Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Main Info */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{deal.deal_type.toUpperCase()}</Badge>
              <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700 capitalize">{deal.status.replace('_', ' ')}</Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 leading-tight">
              {deal.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center"><Building2 className="w-4 h-4 mr-1.5" /> {deal.industry}</span>
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {deal.location}</span>
              <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5" /> Project {deal.id.substring(0, 6).toUpperCase()}</span>
              <span className="flex items-center"><Eye className="w-4 h-4 mr-1.5" /> {deal.view_count} views</span>
            </div>

            <Separator className="bg-zinc-800 my-6" />
            
            <div className="space-y-6">
              <section className="mb-8">
                 <AiSummary dealId={deal.id} initialSummary={deal.ai_summary} />
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Company Overview</h2>
                <div className="text-zinc-300 leading-relaxed max-w-none">
                  {renderText(deal.description || deal.reason || '', 200)}
                </div>
              </section>

              {deal.market_position && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">Market Position</h2>
                  <div className="text-zinc-300 leading-relaxed">
                     {renderText(deal.market_position, 150)}
                  </div>
                </section>
              )}

              {deal.reason && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">Reason for Selling / Raising</h2>
                  <div className="text-zinc-300 leading-relaxed">
                     {renderText(deal.reason, 150)}
                  </div>
                </section>
              )}

              {deal.future_plans && isUnlocked && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">Future Plans</h2>
                  <div className="text-zinc-300 leading-relaxed max-w-none">
                    {renderText(deal.future_plans, 200)}
                  </div>
                </section>
              )}

              {deal.strengths && deal.strengths.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">Key Strengths & Moats</h2>
                  <ul className="list-disc list-inside text-zinc-300 space-y-2">
                    {deal.strengths.map((s: string, idx: number) => (
                      <li key={idx}>{renderText(s, 100)}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="col-span-1">
            {profile && profile.id !== deal.seller_id && (
              <div className="mb-6">
                 <AiMatchScore dealId={deal.id} />
              </div>
            )}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24 shadow-xl">
              <h3 className="text-lg font-semibold mb-6">Financial Snapshot</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Revenue Y3 / LTM</span>
                  <span className="font-medium text-white">{formatCurrency(deal.revenue_y3 || deal.revenue_max)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">EBITDA</span>
                  <span className="font-medium text-white">{formatCurrency(deal.ebitda || deal.ebitda_max)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Net Profit</span>
                  <span className="font-medium text-white">{formatCurrency(deal.net_profit)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-zinc-500 text-sm">Valuation Target</span>
                  <span className="font-medium text-white text-emerald-400">
                    {deal.valuation ? `${formatCurrency(deal.valuation)}` : deal.valuation_min ? `${formatCurrency(deal.valuation_min)} - ${formatCurrency(deal.valuation_max)}` : 'Undisclosed'}
                  </span>
                </div>
              </div>

              {!isUnlocked ? (
                <div className="space-y-4">
                  <NdaModal 
                    dealId={deal.id} 
                    dealTitle={deal.title} 
                    hasRequested={!!ndaStatus} 
                    status={ndaStatus} 
                    onRequestNda={handleRequestNda} 
                    kycStatus={profile?.kyc_status}
                  />
                  <p className="text-xs text-center text-zinc-500">
                    Sign NDA to unlock full company details, financials, and seller contacts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
                    <p className="text-sm font-medium text-emerald-400 mb-1 flex items-center">
                     <Mail className="w-4 h-4 mr-2" /> Seller Contact
                    </p>
                    <p className="text-sm text-white">{deal.users?.full_name}</p>
                    <p className="text-sm text-zinc-400">Role: {deal.users?.role}</p>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    Message Seller
                  </Button>
                </div>
              )}
            </div>

            {/* Similar Deals Sidebar Widget */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
               <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Similar Opportunities</h3>
               <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Link href={`/deals`} key={i} className="block group">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-emerald-400 uppercase tracking-widest">{deal.industry}</span>
                        <span className="font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                           Profitable {deal.industry} Business in {deal.location}
                        </span>
                        <div className="flex gap-3 text-xs text-zinc-500 mt-2 font-mono">
                           <span>Rev: $2.5M</span>
                           <span>Val: $4.0M</span>
                        </div>
                      </div>
                    </Link>
                  ))}
               </div>
               <Link href="/deals" className="text-sm text-zinc-400 hover:text-white mt-6 inline-flex items-center">
                 View more deals <ChevronRight className="w-4 h-4 ml-1" />
               </Link>
            </div>
          </div>

        </div>

        {/* Private Data Section */}
        {isUnlocked ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                Financial Performance
                <Badge variant="outline" className="ml-3 bg-zinc-800 text-zinc-300 border-zinc-700 font-normal">Confidential</Badge>
              </h2>
              {deal.deal_financials?.length > 0 ? (
                 <FinancialCharts 
                   financials={deal.deal_financials} 
                   ownership={deal.ownership_structure || []} 
                 />
              ) : (
                <div className="p-12 text-center border border-zinc-800 border-dashed rounded-xl bg-zinc-900/50">
                  <p className="text-zinc-500">Detailed financials are not provided for this listing yet.</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
                <span>Data Room</span>
                <Link href={`/deals/${deal.id}/dataroom`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20")}>
                   Open Virtual Data Room
                </Link>
              </h2>
              <DocumentList documents={deal.deal_documents || []} isLocked={false} />
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
                <span>Legal Workflow</span>
                <Link href={`/deals/${deal.id}/legal`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20")}>
                   Open Legal Hub
                </Link>
              </h2>
              <p className="text-zinc-400">Generate, review, and e-sign legal documents like NDAs and LOIs.</p>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
                <span>Negotiation Room</span>
                <Link href={`/deals/${deal.id}/negotiate`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20")}>
                   Enter Negotiation
                </Link>
              </h2>
              <p className="text-zinc-400">Discuss deal terms and submit structured offers.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12 opacity-60 pointer-events-none">
            {/* Locked Visuals */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Financial Performance</h2>
              <div className="p-12 text-center border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Lock className="w-8 h-8 text-zinc-500 mb-2" />
                    <p className="font-medium text-white text-lg">Financial Data Locked</p>
                    <p className="text-zinc-400 text-sm">Request NDA to view</p>
                  </div>
                </div>
                {/* Minimal fake skeleton */}
                <div className="h-64 flex items-end justify-center gap-8 blur-md">
                   <div className="w-16 h-32 bg-zinc-800 rounded-t-sm" />
                   <div className="w-16 h-48 bg-zinc-800 rounded-t-sm" />
                   <div className="w-16 h-64 bg-zinc-800 rounded-t-sm" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Data Room</h2>
              <DocumentList documents={[]} isLocked={true} />
            </div>
          </div>
        )}

        {/* Bottom Actions for Seller */}
        {profile?.id === deal.seller_id && (
          <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-col items-center justify-center gap-6 bg-zinc-900/30 p-8 rounded-2xl mb-8">
            <h3 className="text-xl font-semibold text-white">Manage Your Listing</h3>
            <p className="text-zinc-400 text-center max-w-md">As the seller, you can update your deal information anytime or return to your listings overview.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Link href={`/deals/${deal.id}/edit`} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white min-w-[200px]")}>
                Edit Deal
              </Link>
              <Link href="/listings" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white min-w-[200px]")}>
                Exit to My Listings
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Lock Icon internal
function Lock(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  )
}
