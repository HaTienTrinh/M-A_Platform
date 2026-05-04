'use client'

import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  FolderPlus, 
  Upload, 
  Shield, 
  ArrowLeft, 
  Database, 
  Search, 
  Activity,
  ChevronRight,
  Folder,
  Download,
  Trash2,
  FolderOpen,
  Lock
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { cn, formatBytes } from '@/lib/utils'

const FileViewer = dynamic(() => import('@/components/dataroom/FileViewer'), { 
  ssr: false,
  loading: () => <div className="p-12 text-center text-zinc-500">Loading viewer...</div>
})

export default function DataRoomClient({ dealId, isSeller, userId, userName }: any) {
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [activeFolder, setActiveFolder] = useState('Home')
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  
  const supabase = createSupabaseClient()

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    const { data: filesData } = await supabase
      .from('dataroom_files')
      .select('*, dataroom_permissions(*)')
      .eq('deal_id', dealId)
    
    const { data: foldersData } = await supabase
      .from('dataroom_folders')
      .select('*')
      .eq('deal_id', dealId)

    if (filesData) setFiles(filesData)
    if (foldersData) setFolders(foldersData)
    setLoading(false)
  }, [dealId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    setUploading(true)
    for (let i = 0; i < fileList.length; i++) {
       const file = fileList[i]
       const path = `${dealId}/${activeFolder}/${Date.now()}-${file.name}`
       
       const { error: uploadError } = await supabase.storage
         .from('dataroom')
         .upload(path, file)
         
       if (!uploadError) {
         await supabase.from('dataroom_files').insert({
           deal_id: dealId,
           filename: file.name,
           filesize: file.size,
           storage_path: path,
           folder_name: activeFolder,
           uploaded_by: userId
         })

         // Log activity
         await supabase.from('dataroom_activity').insert({
            file_id: (await supabase.from('dataroom_files').select('id').eq('storage_path', path).single()).data?.id,
            user_id: userId,
            action: 'upload'
         })
       }
    }
    setUploading(false)
    fetchData()
  }

  const handleDelete = async (fileId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    
    await supabase.storage.from('dataroom').remove([storagePath])
    await supabase.from('dataroom_files').delete().eq('id', fileId)
    fetchData()
  }

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:')
    if (!name) return
    
    await supabase.from('dataroom_folders').insert({
      deal_id: dealId,
      name: name,
      created_by: userId
    })
    fetchData()
  }

  const canDownload = (file: any) => {
    if (isSeller) return true
    const perm = file.dataroom_permissions?.find((p: any) => p.user_id === userId)
    // Default to view_only if no explicit permission is set
    return perm?.permission_level === 'download'
  }

  const handleDownload = async (file: any) => {
    if (!canDownload(file)) {
      alert("You do not have permission to download this file.")
      return
    }
    const { data } = await supabase.storage.from('dataroom').createSignedUrl(file.storage_path, 3600)
    if (data?.signedUrl) {
       await supabase.from('dataroom_activity').insert({
          file_id: file.id,
          user_id: userId,
          action: 'download'
       })
       window.open(data.signedUrl, '_blank')
    }
  }

  const filteredFiles = files.filter(f => f.folder_name === activeFolder)

  return (
    <div className="flex-1 flex flex-col bg-[#0f1115] text-white overflow-hidden h-screen">
      {/* Top Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#161920]/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-white/60 hover:text-white">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back
           </Button>
           <div className="h-4 w-px bg-white/10" />
           <h1 className="font-semibold flex items-center gap-2 text-zinc-100">
             <Database className="w-5 h-5 text-emerald-500" />
             Data Room
           </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
           <Lock className="w-3 h-3" /> Secure Node
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 flex flex-col bg-[#161920]/30 shrink-0">
           <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Folders</span>
                {isSeller && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-white/40 hover:text-white"
                    onClick={handleCreateFolder}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Button 
                  variant="ghost" 
                  className={cn("w-full justify-start h-9 text-sm", activeFolder === 'Home' ? "bg-white/5 text-emerald-500" : "text-white/60 hover:text-white hover:bg-white/5")}
                  onClick={() => setActiveFolder('Home')}
                >
                   <Folder className="w-4 h-4 mr-2" /> Home
                </Button>
                {folders.map(f => (
                   <Button 
                    key={f.id}
                    variant="ghost" 
                    className={cn("w-full justify-start h-9 text-sm", activeFolder === f.name ? "bg-white/5 text-emerald-500" : "text-white/60 hover:text-white hover:bg-white/5")}
                    onClick={() => setActiveFolder(f.name)}
                   >
                      <Folder className="w-4 h-4 mr-2" /> {f.name}
                   </Button>
                ))}
              </div>
           </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
           {selectedFile ? (
             <div className="absolute inset-0 z-50 flex flex-col bg-[#0f1115]">
                <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#161920]">
                   <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedFile(null)
                        fetchData()
                      }} className="text-white/60">
                         <ArrowLeft className="w-4 h-4 mr-2" /> Close Preview
                      </Button>
                      <div className="h-4 w-px bg-white/10" />
                      <span className="text-sm font-medium text-zinc-100">{selectedFile.filename}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => handleDownload(selectedFile)}>
                         <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                   </div>
                </div>
                <div className="flex-1 overflow-hidden">
                   <FileViewer file={selectedFile} userName={userName} />
                </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="flex items-center justify-between mb-8">
                   <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-white" 
                        placeholder="Search files..."
                      />
                   </div>
                   <div className="flex items-center gap-3">
                      {isSeller && (
                        <>
                          <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            multiple 
                            onChange={handleUpload}
                          />
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            disabled={uploading}
                          >
                             {uploading ? (
                               <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 Uploading...
                               </div>
                             ) : (
                               <><Upload className="w-4 h-4 mr-2" /> Upload File</>
                             )}
                          </Button>
                        </>
                      )}
                   </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                   {loading ? (
                     <div className="flex items-center justify-center p-20 text-white/20">Loading Files...</div>
                   ) : filteredFiles.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                        <FolderOpen className="w-12 h-12 text-white/10 mb-4" />
                        <p className="text-white/40 font-medium">No files in this folder</p>
                        <p className="text-xs text-white/20 mt-1">Upload folders or files to get started.</p>
                     </div>
                   ) : (
                     <table className="w-full">
                        <thead>
                           <tr className="text-left text-[10px] font-bold text-white/20 uppercase tracking-widest border-b border-white/5">
                              <th className="pb-3 pl-4">Name</th>
                              <th className="pb-3">Size</th>
                              <th className="pb-3">Date</th>
                              <th className="pb-3 text-right pr-4">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                           {filteredFiles.map(file => (
                              <tr key={file.id} className="group hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setSelectedFile(file)}>
                                 <td className="py-4 pl-4">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                          <FileText className="w-5 h-5" />
                                       </div>
                                       <span className="text-sm font-medium group-hover:text-blue-400 transition-colors text-zinc-200">{file.filename}</span>
                                    </div>
                                 </td>
                                 <td className="py-4 text-xs text-white/40">{formatBytes(file.filesize)}</td>
                                 <td className="py-4 text-xs text-white/40">{format(new Date(file.created_at), 'MMM d, yyyy')}</td>
                                 <td className="py-4 text-right pr-4">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={(e) => {
                                          e.stopPropagation()
                                          handleDownload(file)
                                       }}><Download className="w-4 h-4" /></Button>
                                       {isSeller && (
                                         <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-red-400" onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(file.id, file.storage_path)
                                         }}>
                                           <Trash2 className="w-4 h-4" />
                                         </Button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   ) }
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  )
}
