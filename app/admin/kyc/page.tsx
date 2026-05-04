// /app/admin/kyc/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Eye, Loader2, ExternalLink } from 'lucide-react'

type Submission = {
  id: string
  user_id: string
  id_document_url: string
  selfie_url: string
  business_license_url: string | null
  status: string
  created_at: string
  users: {
    full_name: string
    email: string
  }[] // in join Supabase gives an array sometimes or object based on relation name. we'll map below.
}

export default function AdminKYCPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  
  useEffect(() => {
    async function fetchSubmissions() {
      // Role check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Fetch pending submissions
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select(`
          id, user_id, id_document_url, selfie_url, business_license_url, status, created_at
        `)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.user_id))]
        const { data: users } = await supabase.from('users').select('id, full_name, role').in('id', userIds)
        
        const merged = data.map(sub => ({
           ...sub,
           users: users?.find(u => u.id === sub.user_id) || { full_name: 'Unknown User', role: 'unknown' }
        }))
        setSubmissions(merged)
      } else {
        setSubmissions([])
      }
      setLoading(false)
    }
    
    fetchSubmissions()
  }, [supabase, router])

  const handleAction = async (id: string, userId: string, action: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/kyc/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action })
      })

      if (!response.ok) {
        throw new Error('Failed to update status via API')
      }

      setSubmissions(submissions.map(s => s.id === id ? { ...s, status: action } : s))
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to update status")
    }
  }

  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(path, 60)
    if (data) {
      window.open(data.signedUrl, '_blank')
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8 pt-24 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Column: List */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold tracking-tight">KYC Submissions</h1>
            <p className="text-sm text-zinc-400 mt-1">Review and approve user identities.</p>
          </div>
          
          <div className="divide-y divide-zinc-800 max-h-[700px] overflow-y-auto">
            {submissions.map((sub) => (
              <div 
                key={sub.id} 
                onClick={() => setSelectedSubmission(sub)}
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors ${selectedSubmission?.id === sub.id ? 'bg-zinc-800/80 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{sub.users?.full_name || 'Unknown User'}</span>
                    <Badge variant={sub.status === 'pending' ? 'outline' : sub.status === 'approved' ? 'default' : 'destructive'} 
                      className={
                        sub.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10' :
                        ''
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Role: <span className="capitalize">{sub.users?.role}</span> • {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-zinc-600" />
              </div>
            ))}
            
            {submissions.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                No submissions found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          {selectedSubmission ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold mb-6">Review Details</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">User Information</p>
                  <p className="font-medium text-sm">{selectedSubmission.users?.full_name}</p>
                  <p className="text-zinc-400 text-sm">Role: <span className="capitalize">{selectedSubmission.users?.role}</span></p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Documents</p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-between bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={() => getSignedUrl(selectedSubmission.id_document_url)}>
                      <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-zinc-400" /> ID Document</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-between bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={() => getSignedUrl(selectedSubmission.selfie_url)}>
                      <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-zinc-400" /> Selfie Video/Photo</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </Button>
                    {selectedSubmission.business_license_url && (
                      <Button variant="outline" size="sm" className="w-full justify-between bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={() => getSignedUrl(selectedSubmission.business_license_url)}>
                        <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-zinc-400" /> Business License</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </Button>
                    )}
                  </div>
                </div>

                {selectedSubmission.status === 'pending' && (
                  <div className="pt-4 border-t border-zinc-800 flex gap-3">
                    <Button 
                      className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20" 
                      onClick={() => handleAction(selectedSubmission.id, selectedSubmission.user_id, 'rejected')}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() => handleAction(selectedSubmission.id, selectedSubmission.user_id, 'approved')}
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </div>
                )}
                
                {selectedSubmission.status !== 'pending' && (
                  <div className="pt-4 border-t border-zinc-800">
                    <div className="text-center py-2 px-4 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-400">
                      This submission has been <span className="font-semibold text-white">{selectedSubmission.status}</span>.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm h-full flex flex-col items-center justify-center text-center sticky top-24 min-h-[300px]">
              <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800 mb-4">
                <Eye className="w-5 h-5 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">Select a submission to review details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
