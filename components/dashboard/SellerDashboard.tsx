'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Plus, Eye, Users, FileSignature, Loader2, Pause, Edit, FileText, CheckCircle2, TrendingUp, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useProfile } from '@/lib/use-profile'
import { toast } from 'sonner'

export function SellerDashboard() {
  const { profile } = useProfile()
  const [deals, setDeals] = useState<any[]>([])
  const [ndas, setNdas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
      
      setDeals(dealsData || [])

      if (dealsData && dealsData.length > 0) {
        const { data: ndaData } = await supabase
          .from('nda_requests')
          .select('*, deals(title)')
          .in('deal_id', dealsData.map(d => d.id))
        setNdas(ndaData || [])
      }

      setLoading(false)
    }
    loadData()
  }, [])

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

  const totalViews = deals.reduce((sum, d) => sum + (d.view_count || 0), 0)
  const totalNdas = ndas.length
  const conversionRate = totalViews > 0 ? ((totalNdas / totalViews) * 100).toFixed(1) : 0

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      {/* Header Section */}
      <div className="relative mb-10 p-8 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/50 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">Seller Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">{profile?.full_name?.split(' ')[0] || 'Partner'}</span>
            </h1>
            <p className="text-zinc-400 max-w-xl text-lg">Manage your listings, review investor interest, and track your M&A deals in real-time.</p>
          </div>
          <Link href="/deals/create" className={cn(buttonVariants({ size: "lg" }), "group relative overflow-hidden bg-white text-zinc-950 hover:bg-zinc-100 font-semibold shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5")}>
            <span className="relative z-10 flex items-center">
              <Plus className="w-5 h-5 mr-2 transition-transform group-hover:rotate-90" /> New Deal Listing
            </span>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap gap-3 bg-transparent border-none p-0 h-auto mb-8 justify-start">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">Overview</TabsTrigger>
          <TabsTrigger value="deals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">My Listings</TabsTrigger>
          <TabsTrigger value="negotiations" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">Negotiations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-zinc-800/50 shadow-lg hover:border-emerald-500/30 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Eye className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20">All Time</Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-zinc-400 text-sm font-medium">Total Deal Views</h3>
                  <p className="text-4xl font-bold text-white tracking-tight">{totalViews.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-zinc-800/50 shadow-lg hover:border-blue-500/30 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-400 opacity-50" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-zinc-400 text-sm font-medium">Investor Interest</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-white tracking-tight">{totalNdas}</p>
                    <span className="text-sm text-zinc-500 font-medium">NDAs</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-zinc-800/50 shadow-lg hover:border-amber-500/30 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="bg-amber-500/5 text-amber-400 border-amber-500/20">Performance</Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-zinc-400 text-sm font-medium">Conversion Rate</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-white tracking-tight">{conversionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">Active Listings</h3>
              <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => document.querySelector('[value="deals"]')?.dispatchEvent(new MouseEvent('click'))}>
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {deals.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl border-dashed">
                <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-1">No deals listed yet</h3>
                <p className="text-zinc-500 mb-6 max-w-md mx-auto">Get started by creating your first deal listing to attract potential investors and buyers.</p>
                <Link href="/deals/create" className={cn(buttonVariants({ variant: "outline" }), "bg-zinc-900 border-zinc-700 hover:bg-zinc-800")}>
                  Create First Deal
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.slice(0, 3).map(deal => (
                  <Link href={`/deals/${deal.id}`} key={deal.id} className="group block">
                    <Card className="bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800/80 transition-all duration-300 overflow-hidden h-full">
                      <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-blue-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg text-white font-bold leading-tight line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {deal.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Badge variant="outline" className={cn("capitalize font-medium", 
                            deal.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                            deal.status === 'draft' ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 inline-block"></span>
                            {deal.status}
                          </Badge>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500">{deal.industry}</span>
                            <span className="text-zinc-400 font-medium">{new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-zinc-800/50 bg-zinc-950/30 pb-4">
              <CardTitle className="text-xl">Deal Portfolio</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 bg-zinc-950 uppercase border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">Deal Name</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Traction</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Created</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {deals.map(deal => {
                    const dealNdas = ndas.filter(n => n.deal_id === deal.id).length
                    return (
                      <tr key={deal.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{deal.title}</p>
                          <p className="text-xs text-zinc-500 mt-1">{deal.industry}</p>
                        </td>
                        <td className="px-6 py-5">
                          <Badge variant="outline" className={cn("capitalize shadow-sm", 
                            deal.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                            deal.status === 'draft' ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            {deal.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-zinc-300"><strong className="text-white">{deal.view_count || 0}</strong> views</span>
                            <span className="text-zinc-300"><strong className="text-white">{dealNdas}</strong> NDAs</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-zinc-400 font-medium">
                          {new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Link href={`/deals/${deal.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8 rounded-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-white hover:border-zinc-500")} title="Edit Deal">
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-zinc-700 bg-zinc-900 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30" title="Pause Deal">
                              <Pause className="w-3.5 h-3.5" />
                            </Button>
                            <Link href={`/dataroom/${deal.id}`} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8 rounded-full border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/50")} title="Data Room">
                              <FileText className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {deals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-zinc-500 text-sm">No listings found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="negotiations" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
             <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
               <FileSignature className="w-10 h-10 text-zinc-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Negotiation Room</h3>
             <p className="text-zinc-400 max-w-md mx-auto mb-8">This space will organize all your active offers, term sheets, and buyer communications.</p>
             <Badge variant="outline" className="bg-zinc-800 text-zinc-300 px-4 py-1.5 text-sm uppercase tracking-wider">Coming Soon</Badge>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
