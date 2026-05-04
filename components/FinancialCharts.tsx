// /components/FinancialCharts.tsx
'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface FinancialData {
  year: string
  revenue: number
  ebitda: number
  ebitda_margin: number
}

interface OwnershipData {
  name: string
  percentage: number
}

interface FinancialChartsProps {
  financials: FinancialData[]
  ownership: OwnershipData[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

export function FinancialCharts({ financials, ownership }: FinancialChartsProps) {
  // Format for charts
  const sortedFinancials = [...financials].sort((a, b) => a.year.localeCompare(b.year))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Revenue & EBITDA (3YR)</CardTitle>
          <CardDescription className="text-zinc-400">Values in $ Millions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedFinancials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fafafa' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ebitda" name="EBITDA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>EBITDA Margin Focus</CardTitle>
          <CardDescription className="text-zinc-400">Margin percentage over 3 years</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedFinancials} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fafafa' }}
                  formatter={(value: number) => [`${value}%`, 'EBITDA Margin']}
                />
                <Line type="monotone" dataKey="ebitda_margin" name="Margin" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6, fill: '#18181b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {ownership && ownership.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
          <CardHeader>
            <CardTitle>Ownership Structure</CardTitle>
            <CardDescription className="text-zinc-400">Cap table breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center justify-between">
             <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ownership}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="percentage"
                    stroke="none"
                  >
                    {ownership.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fafafa' }}
                    formatter={(value: number) => [`${value}%`, 'Ownership']}
                  />
                </PieChart>
              </ResponsiveContainer>
             </div>
             <div className="w-full md:w-1/2 flex flex-col gap-3">
               {ownership.map((owner, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="font-medium text-zinc-200">{owner.name}</span>
                    </div>
                    <span className="font-bold text-white">{owner.percentage}%</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
