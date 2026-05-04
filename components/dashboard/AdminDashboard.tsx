'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Users, FileSignature, CheckCircle2, XCircle, Ban, RefreshCw, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [stats, setStats] = useState({ totalDeals: 0, totalUsers: 0, pendingKyc: 0 })
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createSupabaseClient()
    
    // Load Users
    const { data: userData } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    setUsers(userData || [])
    
    // Load Deals
    const { data: dealData } = await supabase.from('deals').select('*, users(full_name)').order('created_at', { ascending: false })
    setDeals(dealData || [])

    // Calculate Stats
    setStats({
      totalDeals: dealData?.length || 0,
      totalUsers: userData?.length || 0,
      pendingKyc: userData?.filter(u => u.kyc_status === 'pending').length || 0
    })

    setLoading(false)
  }

  const handleAction = async (table: string, id: string, updates: any, successMsg: string) => {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from(table).update(updates).eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(successMsg)
      loadData()
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesKyc = kycFilter === 'all' || u.kyc_status === kycFilter
    return matchesSearch && matchesRole && matchesKyc
  })

  // Chart Data Dummies
  const lineData = [
    { name: 'Jan', deals: 4 }, { name: 'Feb', deals: 7 }, { name: 'Mar', deals: 5 },
    { name: 'Apr', deals: 12 }, { name: 'May', deals: 18 }
  ]
  const pieData = [
    { name: 'Tech', value: 40 }, { name: 'Real Estate', value: 30 },
    { name: 'Healthcare', value: 20 }, { name: 'Other', value: 10 }
  ]
  const areaData = [
    { name: 'Jan', signups: 10 }, { name: 'Feb', signups: 25 }, { name: 'Mar', signups: 45 },
    { name: 'Apr', signups: 60 }, { name: 'May', signups: 120 }
  ]
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Platform management and analytics</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex flex-wrap gap-3 bg-transparent border-none p-0 h-auto mb-8 justify-start">
          <TabsTrigger value="users" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">User Management</TabsTrigger>
          <TabsTrigger value="deals" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">Deal Moderation</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-900/20 bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 text-sm font-medium transition-all">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle>Users</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9 w-64 bg-zinc-950 border-zinc-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select className="bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-300 outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="advisor">Advisor</option>
                </select>
                <select className="bg-zinc-950 border border-zinc-800 rounded-md px-3 text-sm text-zinc-300 outline-none" value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
                  <option value="all">All KYC</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Full Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">KYC Status</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-4 py-3 text-white font-medium">{u.full_name}</td>
                        <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("capitalize", 
                            u.kyc_status === 'verified' ? "text-emerald-400 bg-emerald-500/10" :
                            u.kyc_status === 'rejected' ? "text-red-400 bg-red-500/10" : "text-amber-400 bg-amber-500/10"
                          )}>{u.kyc_status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          {u.kyc_status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleAction('users', u.id, { kyc_status: 'verified' }, 'KYC Approved')}>
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleAction('users', u.id, { kyc_status: 'rejected' }, 'KYC Rejected')}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-zinc-300" title="Ban User">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Deal Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 bg-zinc-950/50 uppercase border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Deal Title</th>
                      <th className="px-4 py-3 font-medium">Seller</th>
                      <th className="px-4 py-3 font-medium">Industry</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Submitted</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map(d => (
                      <tr key={d.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-4 py-3 text-white font-medium">{d.title}</td>
                        <td className="px-4 py-3 text-zinc-400">{d.users?.full_name}</td>
                        <td className="px-4 py-3 text-zinc-400">{d.industry}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{d.status}</Badge></td>
                        <td className="px-4 py-3 text-zinc-500">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          {d.status === 'submitted' || d.status === 'under_review' ? (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleAction('deals', d.id, { status: 'active' }, 'Deal Approved')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleAction('deals', d.id, { status: 'draft' }, 'Deal Rejected')}>
                                Reject
                              </Button>
                            </>
                          ) : (
                             <Button size="sm" variant="ghost" className="h-8 text-zinc-400" onClick={() => handleAction('deals', d.id, { status: 'under_review' }, 'Status reset to under_review')}>
                               Reset
                             </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-6"><h3 className="text-3xl font-bold text-blue-400 mb-1">{stats.totalDeals}</h3><p className="text-zinc-400 text-sm">Total Deals</p></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-6"><h3 className="text-3xl font-bold text-emerald-400 mb-1">{stats.totalUsers}</h3><p className="text-zinc-400 text-sm">Total Users</p></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-6"><h3 className="text-3xl font-bold text-amber-400 mb-1">{stats.pendingKyc}</h3><p className="text-zinc-400 text-sm">Pending KYC</p></CardContent></Card>
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="pt-6"><h3 className="text-3xl font-bold text-purple-400 mb-1">N/A</h3><p className="text-zinc-400 text-sm">Transaction Value</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Deals Created (Last 5 Months)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Line type="monotone" dataKey="deals" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>User Signups</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                    <Area type="monotone" dataKey="signups" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle>Deals by Industry</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
