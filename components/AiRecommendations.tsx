'use client'

import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight, Building2, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function AiRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch('/api/ai/recommendations')
        if (response.status === 401) return
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to fetch recommendations')
        setRecommendations(data.recommendations || [])
      } catch (err) {
        console.error("Failed to fetch recommendations", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecommendations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
        <span className="text-zinc-400">AI is finding your best matches...</span>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center relative z-10 bg-indigo-950/20">
        <h3 className="text-lg font-medium text-white flex items-center gap-2 tracking-tight">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Recommended Deals
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
           Based on your profile
        </span>
      </div>
      
      <div className="divide-y divide-zinc-800/50">
        {recommendations.map((deal) => (
          <Link key={deal.id} href={`/deals/${deal.id}`} className="flex flex-col sm:flex-row p-5 hover:bg-zinc-800/50 transition-colors group relative z-10 gap-4 cursor-pointer block">
             <div className="flex-1">
                <h4 className="font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors mb-1">{deal.title}</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center"><Building2 className="w-3.5 h-3.5 mr-1 text-zinc-500" /> {deal.industry}</span>
                  <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-zinc-500" /> {deal.location}</span>
                </div>
             </div>
             <div className="flex items-center justify-between sm:flex-col sm:justify-start sm:items-end gap-2 shrink-0">
               <div className="text-sm font-semibold text-zinc-200">
                 ${(deal.asking_price / 1000000).toFixed(1)}M
               </div>
               <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
                  View <ArrowRight className="w-3 h-3 ml-1" />
               </Button>
             </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
