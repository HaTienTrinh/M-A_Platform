'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { BookmarkMinus, Loader2, ArrowRight, FileText, Search, Activity, Star } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useProfile } from '@/lib/use-profile'
import { toast } from 'sonner'

export function BuyerDashboard() {
  const { profile } = useProfile()
  const [savedDeals, setSavedDeals] = useState<any[]>([])
  const [followingDeals, setFollowingDeals] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load Saved Deals
      const { data: savedData } = await supabase
        .from('saved_deals')
        .select('id, deals(*)')
        .eq('user_id', user.id)
      
      setSavedDeals(savedData || [])

      // Load NDAs for Following tab
      const { data: ndaData } = await supabase
        .from('nda_requests')
        .select('*, deals(id, title, industry)')
        .eq('buyer_id', user.id)
      
      setFollowingDeals(ndaData || [])

      // Load Offers
      const { data: offersData } = await supabase
        .from('offers')
        .select('*, deals(title)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      setOffers(offersData || [])

      setLoading(false)
    }
    loadData()
  }, [])

  const handleRemoveBookmark = async (savedId: string) => {
    const supabase = createSupabaseClient()
    await supabase.from('saved_deals').delete().eq('id', savedId)
    setSavedDeals(savedDeals.filter(s => s.id !== savedId))
    toast.success('Deal removed from bookmarks')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      {/* Header Section */}
      <div className="relative mb-10 p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">Buyer Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">{profile?.full_name?.split(' ')[0] || 'Investor'}</span>
            </h1>
            <p className="text-zinc-400 max-w-xl text-lg">Track your saved deals, manage NDA requests, and monitor your active offers.</p>
          </div>
          <Link href="/deals" className={cn(buttonVariants({ size: "lg" }), "group relative overflow-hidden bg-white text-zinc-950 hover:bg-zinc-100 font-semibold shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5")}>
            <span className="relative z-10 flex items-center">
              <Search className="w-5 h-5 mr-2" /> Explore Deals
            </span>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="flex flex-wrap gap-3 bg-transparent border-none p-0 h-auto mb-8 justify-start">
          <TabsTrigger value="saved" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">Saved Deals</TabsTrigger>
          <TabsTrigger value="following" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">Following (NDAs)</TabsTrigger>
          <TabsTrigger value="offers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">My Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {savedDeals.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
              <Star className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-300 mb-1">Your saved list is empty</h3>
              <p className="text-zinc-500 mb-6 max-w-md mx-auto">Bookmark interesting deals to easily access them later and track their status.</p>
              <Link href="/deals" className={cn(buttonVariants({ variant: "outline" }), "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white")}>
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedDeals.map((item) => (
                <Card key={item.id} className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-300 group overflow-hidden flex flex-col h-full shadow-lg">
                  <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="flex-1 pb-4">
                    <CardTitle className="text-xl text-white line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                      {item.deals?.title}
                    </CardTitle>
                    <p className="text-sm text-zinc-400 mt-2 font-medium">{item.deals?.industry}</p>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 pb-5 border-t border-zinc-800/50 flex gap-3 bg-zinc-950/20">
                    <Button variant="outline" size="sm" className="flex-1 bg-zinc-950 border-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-950/20 hover:border-red-900 transition-colors" onClick={() => handleRemoveBookmark(item.id)}>
                      Remove
                    </Button>
                    <Link href={`/deals/${item.deals?.id}`} className={cn(buttonVariants({ size: "sm" }), "flex-[2] bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/20")}>
                      View Deal
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30 pb-4">
              <CardTitle className="text-xl">NDA & Access Requests</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 bg-zinc-950 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Deal Name</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Industry</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {followingDeals.map(item => (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{item.deals?.title}</p>
                      </td>
                      <td className="px-6 py-5 text-zinc-400">{item.deals?.industry}</td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={cn("capitalize px-3 py-1 font-medium shadow-sm", 
                          item.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          item.status === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 inline-block"></span>
                          {item.status === 'approved' ? 'NDA Approved' : `NDA ${item.status}`}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {item.status === 'approved' ? (
                          <Link href={`/dataroom/${item.deals?.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors")}>
                            Data Room <ArrowRight className="w-3.5 h-3.5 ml-2" />
                          </Link>
                        ) : (
                          <span className="text-zinc-500 text-xs italic">Awaiting approval</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {followingDeals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        <p>No NDA requests submitted yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30 pb-4">
              <CardTitle className="text-xl">Submitted Offers</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 bg-zinc-950 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Deal Name</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Equity %</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {offers.map(offer => (
                    <tr key={offer.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{offer.deals?.title}</p>
                      </td>
                      <td className="px-6 py-5 text-emerald-400 font-bold">${Number(offer.amount).toLocaleString()}</td>
                      <td className="px-6 py-5 text-zinc-300 font-medium">{offer.equity_percentage}%</td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={cn("capitalize shadow-sm", 
                          offer.status === 'accepted' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          offer.status === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                          offer.status === 'countered' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {offer.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-zinc-500 font-medium">{new Date(offer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/offers/${offer.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10")}>
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {offers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                        <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p>You haven't submitted any offers yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
