'use client'

import { useState } from 'react'
import { DocumentGenerator } from '@/components/legal/DocumentGenerator'
import { SignatureModal } from '@/components/legal/SignatureModal'
import { FileText, Plus, CheckCircle, Clock, Download, PenTool } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createSupabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  deal: any;
  documents: any[];
  isSeller: boolean;
  userId: string;
  userFullName: string;
  sellerCompany: string;
}

export default function LegalClientWrapper({ deal, documents, isSeller, userId, userFullName, sellerCompany }: Props) {
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [docType, setDocType] = useState<'nda' | 'loi' | 'spa'>('nda')
  
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [docToSign, setDocToSign] = useState<any>(null)
  
  const supabase = createSupabaseClient()

  const defaultData = {
    nda: {
      buyerName: userFullName,
      sellerCompany: sellerCompany,
      dealName: deal.title,
      date: new Date().toISOString().split('T')[0]
    },
    loi: {
      buyerName: userFullName,
      sellerCompany: sellerCompany,
      valuation: '',
      equityPercent: '100',
      closingDate: '',
      conditions: ''
    },
    spa: {
      buyerName: !isSeller ? userFullName : '',
      sellerName: isSeller ? userFullName : (sellerCompany || ''),
      dealName: deal.title,
      date: new Date().toISOString().split('T')[0],
      valuation: deal.valuation || '',
      equityPercent: deal.equity_pct || '100',
      completionDate: '',
      paymentTerms: 'Lump sum on completion',
      governingLaw: 'Singapore',
      conditions: '',
      warranties: '',
      covenants: ''
    }
  }

  const handleDownload = async (doc: any) => {
    try {
      const url = doc.signed_pdf_url || doc.pdf_url
      const { data, error } = await supabase.storage.from('legal-documents').createSignedUrl(url, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (e) {
      toast.error('Could not download document')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Legal Documents</h2>
          <p className="text-zinc-400">Manage NDAs, LOIs, and SPAs for this deal.</p>
        </div>
        
        <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: 'default' }),
              "bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-10 px-4 py-2"
            )}
          >
            <Plus className="w-4 h-4" /> Generate Document
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New Legal Document</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 my-4">
              <Button variant={docType === 'nda' ? 'default' : 'outline'} className={docType === 'nda' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-zinc-900 border-zinc-700 text-zinc-300'} onClick={() => setDocType('nda')}>NDA</Button>
              <Button variant={docType === 'loi' ? 'default' : 'outline'} className={docType === 'loi' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-zinc-900 border-zinc-700 text-zinc-300'} onClick={() => setDocType('loi')}>LOI</Button>
              <Button variant={docType === 'spa' ? 'default' : 'outline'} className={docType === 'spa' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-zinc-900 border-zinc-700 text-zinc-300'} onClick={() => setDocType('spa')}>SPA</Button>
            </div>
            <DocumentGenerator 
               dealId={deal.id} 
               docType={docType} 
               defaultData={(defaultData as any)[docType]}
               onSuccess={() => setGeneratorOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 text-center">
            <FileText className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No documents yet</h3>
            <p className="text-zinc-500 max-w-sm mb-6">
              Generate your first non-disclosure agreement or letter of intent to start the legal workflow.
            </p>
            <Button onClick={() => setGeneratorOpen(true)} variant="outline" className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800">
               Generate Document
            </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map(doc => {
            const hasSigned = doc.document_signatures?.some((s: any) => s.signer_id === userId)
            
            return (
              <div key={doc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-zinc-950 rounded-lg shrink-0">
                     <FileText className="w-6 h-6 text-emerald-500" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-white uppercase tracking-wider">{doc.doc_type} generated</h3>
                     <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                       <span>{format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}</span>
                       <span>•</span>
                       <Badge variant="outline" className={
                         doc.status === 'fully_signed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                         'bg-amber-500/10 text-amber-400 border-amber-500/20'
                       }>
                         {doc.status === 'fully_signed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                         {doc.status.replace('_', ' ')}
                       </Badge>
                     </div>
                     
                     {/* Signatures List */}
                     {doc.document_signatures && doc.document_signatures.length > 0 && (
                       <div className="mt-4 space-y-1.5">
                         <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">Signatures</span>
                         {doc.document_signatures.map((sig: any) => (
                           <div key={sig.id} className="text-sm flex items-center text-zinc-300">
                             <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                             {sig.signer_name} ({sig.signer_role}) <span className="text-zinc-600 ml-2 text-xs">{format(new Date(sig.signed_at), 'MMM d')}</span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                   <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white">
                     <Download className="w-4 h-4 mr-2" /> Download
                   </Button>
                   
                   {!hasSigned && doc.status !== 'fully_signed' && (
                     <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => {
                       setDocToSign(doc)
                       setSignModalOpen(true)
                     }}>
                       <PenTool className="w-4 h-4 mr-2" /> Sign Now
                     </Button>
                   )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {docToSign && (
        <SignatureModal
          document={docToSign}
          isOpen={signModalOpen}
          onClose={() => {
            setSignModalOpen(false)
            setDocToSign(null)
          }}
          userFullName={userFullName || 'Unknown User'}
          userRole={isSeller ? 'seller' : 'buyer'}
        />
      )}
    </div>
  )
}
