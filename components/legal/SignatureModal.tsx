'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Download, PenTool } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

interface Props {
  document: any;
  isOpen: boolean;
  onClose: () => void;
  userFullName: string;
  userRole: string; // 'buyer' | 'seller'
}

export function SignatureModal({ document, isOpen, onClose, userFullName, userRole }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const supabase = createSupabaseClient()

  const handleDownloadPreview = async () => {
    try {
      const url = document.signed_pdf_url || document.pdf_url
      const { data, error } = await supabase.storage.from('legal-documents').createSignedUrl(url, 60)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (e: any) {
      toast.error('Could not load preview')
    }
  }

  const handleSign = async () => {
    if (!agreed) {
      toast.error('You must agree to the legally binding terms.')
      return
    }
    if (signature.trim().toLowerCase() !== userFullName.toLowerCase()) {
      toast.error('Your typed name must match your legal full name.')
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch('/api/legal/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          signerName: signature,
          signerRole: userRole
        })
      });

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to sign document')
      }
      
      toast.success('Document signed successfully')
      onClose()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-emerald-500" />
            E-Sign Document: {document?.doc_type?.toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-400 mb-4">
              Please review the document before signing. By signing, you agree that your electronic signature is legally binding.
            </p>
            <Button variant="outline" onClick={handleDownloadPreview} className="w-full bg-zinc-950 border-zinc-700">
               <Download className="w-4 h-4 mr-2" /> View PDF Preview
            </Button>
          </div>

          <div className="space-y-3">
             <div className="flex space-x-2 items-start">
               <Checkbox 
                  id="agree" 
                  checked={agreed} 
                  onCheckedChange={(c) => setAgreed(c as boolean)} 
                  className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
               />
               <div className="grid gap-1.5 leading-none">
                 <Label htmlFor="agree" className="text-sm font-medium leading-tight">
                   I agree to use electronic records and signatures.
                 </Label>
                 <p className="text-xs text-zinc-500">
                   By checking this box, you consent to the terms of service and acknowledge that this action has the same legal effect as a handwritten signature.
                 </p>
               </div>
             </div>
          </div>

          <div className="space-y-2">
             <Label>Type your full legal name: <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">{userFullName}</span></Label>
             <Input 
                value={signature} 
                onChange={e => setSignature(e.target.value)}
                placeholder={userFullName}
                className="bg-zinc-900 border-zinc-800 font-serif text-lg py-6"
             />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
             <Button variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-zinc-800">Cancel</Button>
             <Button onClick={handleSign} disabled={loading || !agreed || !signature} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign & Complete
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
