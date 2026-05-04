// /components/dataroom/FileViewer.tsx
'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/use-profile'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Loader2, AlertCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'

// Configure worker for react-pdf v9
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface FileViewerProps {
  file: any
  userName?: string
}

export default function FileViewer({ file, userName: userNameProp }: FileViewerProps) {
  const supabase = createSupabaseClient()
  const { profile } = useProfile()
  const [url, setUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const activityLogged = useRef(false)

  const userName = userNameProp || profile?.full_name || 'User'

  useEffect(() => {
    async function loadFile() {
      try {
        setLoading(true)
        setError(null)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        // Get signed URL
        const { data, error: storageError } = await supabase.storage.from('dataroom').createSignedUrl(file.storage_path, 3600)
        
        if (storageError || !data) {
          setError('Error generating secure link')
          setLoading(false)
          return
        }
        
        setUrl(data.signedUrl)
        
        // Log view activity (only once per file load)
        if (user && file.id && !activityLogged.current) {
          await supabase.from('dataroom_activity').insert({
            file_id: file.id,
            user_id: user.id,
            action: 'view',
            created_at: new Date().toISOString(),
          })
          activityLogged.current = true
        }
      } catch (err) {
        console.error('FileViewer Error:', err)
        setError('Failed to initialize viewer')
      } finally {
        setLoading(false)
      }
    }
    
    if (file?.storage_path) {
      activityLogged.current = false // Reset for new file
      loadFile()
    }
    setPageNumber(1)
  }, [file, supabase])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const isPdf = file?.filename?.toLowerCase().endsWith('.pdf')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
         <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 h-full">
         <AlertCircle className="w-10 h-10 mb-4 text-red-500" />
         <p>{error || 'Unable to load file preview'}</p>
      </div>
    )
  }

  if (!isPdf) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 h-full text-center">
         <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-lg">
           <FileText className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
           <p className="text-white font-medium mb-2">No Preview Available</p>
           <p className="text-zinc-500 text-sm">
             We currently support inline preview only for PDF documents. Please download &quot;{file.filename}&quot; to view it.
           </p>
         </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-zinc-950" ref={containerRef}>
      
      {/* Watermark Overlay - Repeating Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 10 }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-zinc-400 text-sm font-medium select-none"
            style={{
              top: `${(i % 5) * 20 + 5}%`,
              left: `${Math.floor(i / 5) * 25}%`,
              transform: 'rotate(-35deg)',
              opacity: 0.15,
              whiteSpace: 'nowrap',
            }}
          >
            Confidential — {userName} — {format(new Date(), 'dd/MM/yyyy')}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {numPages && numPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-[#161920]/90 border border-white/10 shadow-2xl backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-6 text-xs font-semibold">
          <button 
            disabled={pageNumber <= 1} 
            onClick={() => setPageNumber(p => p - 1)}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          >
            Prev
          </button>
          <span className="text-zinc-400">Page <span className="text-white">{pageNumber}</span> of {numPages}</span>
          <button 
            disabled={pageNumber >= numPages} 
            onClick={() => setPageNumber(p => p + 1)}
            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Document Content */}
      <div className="flex-1 overflow-auto flex justify-center py-8 custom-scrollbar">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => {
            console.error('PDF Load Error:', err)
            setError('Failed to render PDF document')
          }}
          loading={
            <div className="flex items-center justify-center p-24 text-zinc-500">
               <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
          className="max-w-full drop-shadow-2xl"
        >
          <Page 
             pageNumber={pageNumber} 
             renderTextLayer={false} 
             renderAnnotationLayer={false} 
             className="border border-white/5 bg-white"
             loading={<div className="w-[600px] h-[800px] bg-zinc-900 animate-pulse rounded" />}
          />
        </Document>
      </div>
    </div>
  )
}

