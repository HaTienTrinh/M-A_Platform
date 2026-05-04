'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Activity, Users, DollarSign, Target, Loader2 } from 'lucide-react'

// Dummy data for charts - in production, fetch this from API/DB
const activityData = [
  { name: 'Jan', deals: 4 },
  { name: 'Feb', deals: 7 },
  { name: 'Mar', deals: 12 },
  { name: 'Apr', deals: 15 },
  { name: 'May', deals: 25 },
  { name: 'Jun', deals: 19 },
]

const industryData = [
  { name: 'SaaS', value: 400 },
  { name: 'E-commerce', value: 300 },
  { name: 'Agency', value: 300 },
  { name: 'Manufacturing', value: 200 },
]

const userGrowthData = [
  { name: 'Jan', users: 100 },
  { name: 'Feb', users: 200 },
  { name: 'Mar', users: 350 },
  { name: 'Apr', users: 600 },
  { name: 'May', users: 1200 },
]

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalUsers: 0,
    totalTxValue: 0,
    activeDeals: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/analytics')
        const data = await res.json()
        if (data.analytics) {
          setStats({
            totalDeals: data.analytics.total_deals,
            totalUsers: data.analytics.total_users,
            totalTxValue: 0, // In production, expand API to return tx value
            activeDeals: data.analytics.active_deals
          })
        }
      } catch (err) {
        console.error('Failed to load stats', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [supabase])

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-400">Platform overview and key metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Total Deals</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalDeals}</div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Total Users</h3>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Transaction Value</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">${(stats.totalTxValue / 1000000).toFixed(1)}M</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-400">Active Deals</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.activeDeals}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">User Growth</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                     <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                     <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                        itemStyle={{ color: '#e4e4e7' }}
                     />
                     <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Deals by Industry</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                     >
                        {industryData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-6">Deal Activity (12 Months)</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                     <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                     />
                     <Line type="monotone" dataKey="deals" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  )
}
