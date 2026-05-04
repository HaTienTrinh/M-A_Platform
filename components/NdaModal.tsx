// /components/NdaModal.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FileSignature, Loader2, ShieldAlert } from 'lucide-react'

interface NdaModalProps {
  dealId: string
  dealTitle: string
  hasRequested: boolean
  status: string | null
  kycStatus?: string
  onRequestNda: (signature: string) => Promise<void>
}

export function NdaModal({ dealId, dealTitle, hasRequested, status, kycStatus = 'verified', onRequestNda }: NdaModalProps) {
  const [open, setOpen] = useState(false)
  const [signature, setSignature] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !signature.trim()) return

    setLoading(true)
    try {
      await onRequestNda(signature)
      setOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (kycStatus !== 'approved' && kycStatus !== 'verified') {
    return (
      <Button disabled variant="outline" className="w-full bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed">
        <ShieldAlert className="w-4 h-4 mr-2" /> Verify KYC to Request NDA
      </Button>
    )
  }

  if (hasRequested) {
    if (status === 'approved') {
      return (
        <Button disabled variant="outline" className="w-full bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <ShieldAlert className="w-4 h-4 mr-2" /> NDA Signed & Approved
        </Button>
      )
    }
    if (status === 'rejected') {
      return (
        <Button disabled variant="outline" className="w-full bg-red-500/10 text-red-500 border-red-500/20">
          NDA Request Rejected
        </Button>
      )
    }
    return (
      <Button disabled variant="outline" className="w-full bg-amber-500/10 text-amber-500 border-amber-500/20">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> NDA Review Pending
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20" />
      }>
        <FileSignature className="w-4 h-4 mr-2" /> Request NDA to Unlock
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Non-Disclosure Agreement</DialogTitle>
          <DialogDescription className="text-zinc-400">
            You are requesting access to confidential information for <strong>{dealTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-300 leading-relaxed font-mono">
          <p className="mb-2"><strong>MUTUAL NON-DISCLOSURE AGREEMENT</strong></p>
          <p className="mb-2">This Non-Disclosure Agreement (the &quot;Agreement&quot;) is entered into to protect confidential information disclosed between the parties for the purpose of evaluating a potential transaction.</p>
          <p className="mb-2">1. The Receiving Party agrees to hold in confidence and not disclose the Confidential Information to any third party.</p>
          <p className="mb-2">2. The Confidential Information includes financial records, customer lists, intellectual property, and strategic plans.</p>
          <p>By electronically signing this document, you acknowledge your legal obligation to maintain strict confidentiality.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="signature" className="text-sm">Electronic Full Name Signature</Label>
            <Input 
              id="signature" 
              placeholder="e.g. John Doe" 
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
              required
            />
          </div>

          <div className="flex items-start space-x-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
            <Checkbox 
              id="agree" 
              checked={agreed} 
              onCheckedChange={(c) => setAgreed(c as boolean)} 
              className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="agree"
                className="text-sm font-medium leading-none text-zinc-300 cursor-pointer"
              >
                I agree to the NDA terms
              </label>
              <p className="text-xs text-zinc-500">
                You acknowledge this creates a legally binding contract.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={!agreed || !signature.trim() || loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
            Sign & Submit Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
