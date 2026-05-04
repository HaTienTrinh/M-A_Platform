'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Loader2, UserCog, UserX, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createNotification } from '@/lib/notifications'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createSupabaseClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setUsers(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAction = async (userId: string, action: string) => {
    try {
      let updateData = {}
      let notifParams = null

      if (action === 'approve_kyc') {
        updateData = { kyc_status: 'verified' }
        notifParams = { type: 'kyc_updated', title: 'KYC Approved', body: 'Your identity verification has been approved.', emailData: { status: 'Verified' } }
      } else if (action === 'reject_kyc') {
        updateData = { kyc_status: 'rejected' }
        notifParams = { type: 'kyc_updated', title: 'KYC Rejected', body: 'Your identity verification was rejected.', emailData: { status: 'Rejected' } }
      } else if (action === 'ban') {
        // Here we could have an 'is_banned' column, or just change role to something else
        toast.info('Ban user logic would go here')
        return
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.from('users').update(updateData).eq('id', userId)
        if (error) throw error
        
        toast.success(`User updated successfully`)
        fetchUsers()

        if (notifParams) {
          // Call API route to dispatch notification to hit server environment (because RESEND_API_KEY is secret)
          await fetch('/api/admin/notify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId, ...notifParams })
          })
        }
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">User Management</h1>
        <p className="text-zinc-400">View and manage platform users, roles, and KYC statuses.</p>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-950 border-zinc-800 text-white w-full max-w-md"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">KYC Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-200">{user.full_name || 'No Name'}</div>
                        <div className="text-xs text-zinc-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-zinc-800/50 text-zinc-300 border-zinc-700 capitalize">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          user.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          user.kyc_status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }>
                          {user.kyc_status === 'pending' ? 'Pending' : user.kyc_status === 'verified' ? 'Verified' : 'Rejected'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                         {user.kyc_status !== 'verified' && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-8 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300"
                             onClick={() => handleAction(user.id, 'approve_kyc')}
                           >
                             <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve KYC
                           </Button>
                         )}
                         {user.kyc_status !== 'rejected' && (
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-8 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
                             onClick={() => handleAction(user.id, 'reject_kyc')}
                           >
                             <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject KYC
                           </Button>
                         )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No users found.</td>
                     </tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  )
}
