'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Loader2, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  dealId: string;
  initialSummary?: string;
}

export function AiSummary({ dealId, initialSummary }: Props) {
  const [summary, setSummary] = useState<string>(initialSummary || '')
  const [loading, setLoading] = useState(!initialSummary)
  const [generating, setGenerating] = useState(false)
  
  const generateSummary = useCallback(async () => {
    setLoading(true)
    setGenerating(true)
    setSummary('')
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate AI Summary')
      setSummary(data.summary)

    } catch (err: any) {
      console.error(err)
      setSummary("Failed to generate AI Summary. Please try again.")
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }, [dealId])

  useEffect(() => {
    if (!initialSummary && dealId) {
      generateSummary()
    }
  }, [dealId, initialSummary, generateSummary])

  if (loading && !summary) {
    return (
      <div className="p-6 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center py-12 text-zinc-500">
        <Sparkles className="w-8 h-8 mb-4 text-indigo-500/50" />
        <div className="flex items-center gap-2">
           <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
           Generating executive summary...
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 border border-zinc-800 bg-zinc-900/50 rounded-xl relative group">
      <div className="absolute top-4 right-4 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
         <Button variant="ghost" size="icon" onClick={generateSummary} disabled={generating} className="h-8 w-8 text-zinc-400 hover:text-indigo-400">
           <RefreshCcw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
         </Button>
      </div>

      <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-6 uppercase tracking-wider text-sm border-b border-zinc-800/50 pb-4">
        <Sparkles className="w-4 h-4" /> AI Generated Executive Summary
      </div>
      
      <div className="space-y-6 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
        {summary}
      </div>
    </div>
  )
}
