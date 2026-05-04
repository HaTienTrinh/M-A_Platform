'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, CornerDownRight, X } from 'lucide-react'

interface Props {
  dealId: string;
  dealTitle: string;
  buyerId: string;
  sellerId: string;
  partnerId: string;
  parentOffer: any | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function OfferForm({ dealId, dealTitle, buyerId, sellerId, partnerId, parentOffer, onCancel, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [valuation, setValuation] = useState('')
  const [equityPct, setEquityPct] = useState('')
  const [conditions, setConditions] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (parentOffer) {
      setValuation(parentOffer.valuation.toString())
      setEquityPct(parentOffer.equity_pct.toString())
      setConditions(parentOffer.conditions || '')
      setMessage('') // clear msg space for user
    } else {
      setValuation('')
      setEquityPct('')
      setConditions('')
      setMessage('')
    }
  }, [parentOffer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          dealTitle,
          buyerId,
          sellerId,
          partnerId,
          valuation: parseFloat(valuation),
          equityPct: parseFloat(equityPct),
          conditions,
          message,
          parentOfferId: parentOffer?.id
        })
      })
      
      if (!res.ok) throw new Error('Failed to submit offer')
      toast.success('Offer submitted')
      onSuccess()
      setValuation('')
      setEquityPct('')
      setConditions('')
      setMessage('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
          {parentOffer ? <><CornerDownRight className="w-4 h-4 text-amber-500" /> Counter Offer</> : 'New Offer'}
        </h3>
        {parentOffer && (
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-zinc-800 text-zinc-400 hover:text-white" onClick={onCancel}>
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      <div className="space-y-3 overflow-auto custom-scrollbar flex-1 pr-1">
         <div>
           <Label className="text-xs text-zinc-400">Valuation ($)</Label>
           <Input 
             type="number" 
             required 
             value={valuation} 
             onChange={(e) => setValuation(e.target.value)} 
             className="bg-zinc-950 border-zinc-800 h-8 mt-1" 
             placeholder="5000000"
           />
         </div>
         <div>
           <Label className="text-xs text-zinc-400">Equity (%)</Label>
           <Input 
             type="number" 
             required 
             value={equityPct} 
             onChange={(e) => setEquityPct(e.target.value)} 
             className="bg-zinc-950 border-zinc-800 h-8 mt-1" 
             placeholder="100"
           />
         </div>
         <div>
           <Label className="text-xs text-zinc-400">Key Conditions</Label>
           <Input 
             value={conditions} 
             onChange={(e) => setConditions(e.target.value)} 
             className="bg-zinc-950 border-zinc-800 h-8 mt-1" 
             placeholder="e.g. 30 day DD period"
           />
         </div>
         <div>
           <Label className="text-xs text-zinc-400">Message (Optional)</Label>
           <Textarea 
             value={message} 
             onChange={(e) => setMessage(e.target.value)} 
             className="bg-zinc-950 border-zinc-800 min-h-[60px] text-sm mt-1 custom-scrollbar resize-none" 
             placeholder="Add context..."
           />
         </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-zinc-800 shrink-0">
        <Button disabled={loading || !valuation || !equityPct} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Submit Offer'}
        </Button>
      </div>
    </form>
  )
}
