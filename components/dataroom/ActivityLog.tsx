// /components/dataroom/ActivityLog.tsx
'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Eye, Download, User, FileSpreadsheet, FileText as FilePdf, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export function ActivityLog({ dealId }: { dealId: string }) {
  const supabase = createSupabaseClient()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function fetchLogs() {
      // First get all files for this deal
      const { data: files } = await supabase
        .from('dataroom_files')
        .select('id, filename')
        .eq('deal_id', dealId)
        
      if (files && files.length > 0) {
        const fileIds = files.map(f => f.id)
        // Now get activity
        const { data: activity } = await supabase
          .from('dataroom_activity')
          .select('*, users(full_name, email)')
          .in('file_id', fileIds)
          .order('created_at', { ascending: false })
          .limit(100)
          
        if (activity) {
          // Join filename
          const fullLogs = activity.map(a => ({
            ...a,
            filename: files.find(f => f.id === a.file_id)?.filename || 'Unknown file'
          }))
          setLogs(fullLogs)
        }
      }
      setLoading(false)
    }
    
    fetchLogs()
  }, [dealId, supabase])

  const handleExport = async (formatType: 'xlsx' | 'pdf') => {
    setExporting(true)
    try {
      const response = await fetch(`/api/dataroom/${dealId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: formatType }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // The filename is set by Content-Disposition header in API
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `audit_report.${formatType}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Exported as ${formatType === 'xlsx' ? 'Excel' : 'PDF'}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-zinc-500">Loading activity...</div>
  }

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Access Log</h2>
        
        {logs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Report
                <ChevronDown className="w-4 h-4 ml-2 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <DropdownMenuItem 
                onClick={() => handleExport('xlsx')}
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')}
                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
              >
                <FilePdf className="w-4 h-4 mr-2 text-rose-500" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex-1 overflow-auto bg-zinc-950 border border-zinc-800 rounded-xl">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No activity recorded yet for this data room.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">File</th>
              <th className="px-6 py-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {logs.map((log) => {
               const isView = log.action === 'view'
               return (
                <tr key={log.id} className="hover:bg-zinc-900/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <User className="w-4 h-4 text-zinc-500" />
                       <span className="text-zinc-200">{log.users?.full_name || log.users?.email || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isView ? (
                        <span className="flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" /> Viewed
                        </span>
                      ) : (
                        <span className="flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                          <Download className="w-3.5 h-3.5 mr-1" /> Downloaded
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-medium">
                    {log.filename}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-500 text-xs whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </td>
                </tr>
               )
            })}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}
