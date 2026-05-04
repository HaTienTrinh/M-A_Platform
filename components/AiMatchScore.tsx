'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  dealId: string;
}

export function AiMatchScore({ dealId }: Props) {
  const [scoreData, setScoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchScore() {
      try {
        const response = await fetch(`/api/ai/match-score?dealId=${encodeURIComponent(dealId)}`)
        if (response.status === 401) return
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to calculate score')
        setScoreData(data.score)

      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchScore()
  }, [dealId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-indigo-400 p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-xl animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Calculating AI Match Score...</span>
      </div>
    )
  }

  if (error || !scoreData) {
    return null; // Don't show anything if it failed, or perhaps show a subtle error
  }

  const { match_score, risk_score, growth_score, reasons } = scoreData

  return (
    <div className="p-5 border border-indigo-500/30 bg-indigo-950/20 rounded-xl relative overflow-hidden group hover:bg-indigo-950/30 transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="flex items-start justify-between mb-4">
         <div>
           <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-sm mb-1 uppercase tracking-wider">
             <Sparkles className="w-4 h-4" /> AI Match Analysis
           </div>
           <p className="text-xs text-zinc-400">Based on your investor profile and history.</p>
         </div>
         <div className="flex flex-col items-end">
           <span className="text-3xl font-bold font-mono text-white tracking-tighter">{match_score}<span className="text-lg text-indigo-400/50">/100</span></span>
           <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-widest mt-1">Match Score</span>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-zinc-300"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Growth</span>
            <span className="font-mono text-zinc-400">{growth_score}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex w-full">
            <div className="bg-emerald-500 rounded-full" style={{ width: `${growth_score}%` }}></div>
          </div>
        </div>
        <div>
           <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-zinc-300"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risk</span>
            <span className="font-mono text-zinc-400">{risk_score}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex w-full">
            <div className="bg-amber-500 rounded-full" style={{ width: `${risk_score}%` }}></div>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-indigo-500/20 pt-3">
        {reasons?.map((reason: string, i: number) => (
          <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
             <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
             <span>{reason}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
