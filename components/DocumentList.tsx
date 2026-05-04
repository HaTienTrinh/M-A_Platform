// /components/DocumentList.tsx
'use client'

import { FileText, Download, Lock, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase/client'

interface Document {
  id: string
  title: string
  document_url: string
}

interface DocumentListProps {
  documents: Document[]
  isLocked: boolean
}

export function DocumentList({ documents, isLocked }: DocumentListProps) {
  const supabase = createSupabaseClient()

  const handleDownload = async (path: string, fileName: string) => {
    // Requires signed url if private
    const { data, error } = await supabase.storage.from('deal-documents').createSignedUrl(path, 60 * 5)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
      console.error(error)
      alert("Failed to access document.")
    }
  }

  if (isLocked) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-zinc-500" />
            Deal Documents
          </CardTitle>
          <CardDescription className="text-zinc-400">Sign NDA to access these files</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-3">
             <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500"><FileText className="w-5 h-5" /></div>
                 <div>
                   <p className="font-medium text-zinc-300 blur-[4px] select-none">Pitch Deck 2024.pdf</p>
                   <p className="text-xs text-zinc-600 blur-[2px] select-none">2.4 MB</p>
                 </div>
               </div>
             </div>
             <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500"><File className="w-5 h-5" /></div>
                 <div>
                   <p className="font-medium text-zinc-300 blur-[4px] select-none">Financial Model v2.xlsx</p>
                   <p className="text-xs text-zinc-600 blur-[2px] select-none">1.1 MB</p>
                 </div>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle>Deal Documents</CardTitle>
        <CardDescription className="text-zinc-400">Available files for due diligence</CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-zinc-500 text-sm py-4 text-center">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const fileExt = doc.document_url.split('.').pop()?.toUpperCase() || 'FILE'
              
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                      {fileExt === 'PDF' ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{doc.title}</p>
                      <p className="text-xs text-zinc-500">{fileExt} Document</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.document_url, doc.title)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
