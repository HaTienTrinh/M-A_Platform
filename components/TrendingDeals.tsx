// /components/TrendingDeals.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { DealCard } from './DealCard'
import { Loader2, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'

export function TrendingDeals({ isVerified }: { isVerified: boolean }) {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/deals/trending')
        const data = await res.json()
        if (Array.isArray(data)) {
          setDeals(data)
        }
      } catch (err) {
        console.error('Failed to fetch trending deals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (deals.length === 0) return null

  return (
    <section className="py-12 border-b border-zinc-800/50">
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Top Trending Deals</h2>
            <p className="text-sm text-zinc-500">Highest engagement deals in the last 72 hours</p>
          </div>
        </div>
      </div>

      <div className="relative group">
        <div className="flex overflow-x-auto gap-6 px-4 pb-6 scrollbar-hide snap-x snap-mandatory scroll-smooth">
          {deals.map((deal, idx) => (
            <motion.div 
              key={deal.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="min-w-[320px] md:min-w-[380px] snap-start"
            >
              <DealCard deal={deal} isVerified={isVerified} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
