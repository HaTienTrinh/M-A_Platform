'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Loader2, Search, Users, CheckCircle2, XCircle, 
  Ban, TrendingUp, ShieldCheck, Briefcase, 
  UserCircle, Crown, LayoutDashboard, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [stats, setStats] = useState({ totalDeals: 0, totalUsers: 0, pendingKyc: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(false) // Giả định dữ liệu load nhanh để focus vào UI
    const supabase = createSupabaseClient()
    const { data: userData } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    const { data: dealData } = await supabase.from('deals').select('*, users(full_name)').order('created_at', { ascending: false })
    
    setUsers(userData || [])
    setDeals(dealData || [])
    setStats({
      totalDeals: dealData?.length || 0,
      totalUsers: userData?.length || 0,
      pendingKyc: userData?.filter(u => u.kyc_status === 'pending').length || 0
    })
  }

  const getRoleBadge = (role: string) => {
    const roles: Record<string, any> = {
      admin: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <Crown className="w-3 h-3 mr-1" /> },
      seller: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Briefcase className="w-3 h-3 mr-1" /> },
      buyer: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <Zap className="w-3 h-3 mr-1" /> },
      advisor: { color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: <UserCircle className="w-3 h-3 mr-1" /> },
    }
    const current = roles[role?.toLowerCase()] || roles.buyer
    return (
      <Badge variant="outline" className={cn("px-2 py-0.5 font-bold uppercase text-[10px]", current.color)}>
        {current.icon} {role}
      </Badge>
    )
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-6 space-y-10 animate-in fade-in duration-500">
      {/* 1. Header & Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-zinc-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs mb-2 tracking-[0.3em] uppercase">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Administrator Access
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
            Xin chào, Thịnh <span className="text-zinc-700">/</span>
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-xl px-6 h-12 transition-all active:scale-95">
             Export Data
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 h-12 shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
             Generate Report
          </Button>
        </div>
      </div>

      {/* 2. Stats Grid - Glossy Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Tổng giao dịch" value={stats.totalDeals} trend="+12%" icon={<TrendingUp className="text-blue-500" />} color="blue" />
        <StatsCard title="Người dùng mới" value={stats.totalUsers} trend="+5.4%" icon={<Users className="text-emerald-500" />} color="emerald" />
        <StatsCard title="Chờ duyệt KYC" value={stats.pendingKyc} trend="Action Required" icon={<ShieldCheck className="text-amber-500" />} color="amber" />
        <StatsCard title="Tỷ lệ chuyển đổi" value="64%" trend="+2%" icon={<Zap className="text-purple-500" />} color="purple" />
      </div>

      {/* 3. Main Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-2xl mb-8 inline-flex">
          <TabsTrigger value="users" className="tab-premium">User Base</TabsTrigger>
          <TabsTrigger value="deals" className="tab-premium">Moderation</TabsTrigger>
          <TabsTrigger value="analytics" className="tab-premium">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="p-6 border-b border-zinc-800 flex flex-col lg:flex-row justify-between gap-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <LayoutDashboard className="w-5 h-5 text-emerald-500" /> Quản lý tài khoản
               </h3>
               <div className="flex flex-wrap gap-3">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input placeholder="Tìm kiếm tên, email..." className="pl-10 bg-black border-zinc-800 w-72 h-11 rounded-xl focus:border-emerald-500/50 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <select className="bg-black border border-zinc-800 rounded-xl px-4 text-sm font-bold text-zinc-400 outline-none hover:border-zinc-700 transition-all" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">Mọi vai trò</option>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="advisor">Advisor</option>
                  </select>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-950/50 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Role & Identity</th>
                    <th className="px-6 py-4">KYC Status</th>
                    <th className="px-6 py-4">Ngày gia nhập</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-medium">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold group-hover:text-emerald-400 transition-colors">{u.full_name}</span>
                          <span className="text-xs text-zinc-500 font-mono italic">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-5">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border",
                          u.kyc_status === 'verified' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", u.kyc_status === 'verified' ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
                          {u.kyc_status?.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-zinc-500 font-mono text-xs">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-5 text-right">
                        <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                          <Ban className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* CSS Ghi đè cho hiệu ứng cao cấp */}
      <style jsx global>{`
        .tab-premium {
          @apply rounded-xl px-6 py-2 text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-inner;
        }
      `}</style>
    </div>
  )
}

function StatsCard({ title, value, trend, icon, color }: any) {
  const colors: any = {
    blue: "group-hover:border-blue-500/50",
    emerald: "group-hover:border-emerald-500/50",
    amber: "group-hover:border-amber-500/50",
    purple: "group-hover:border-purple-500/50",
  }
  return (
    <div className={cn("bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl group transition-all duration-500 hover:bg-zinc-900/60", colors[color])}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border", 
          color === 'emerald' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
    </div>
  )
}