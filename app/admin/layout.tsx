'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/DashboardLayout'
import { redirect } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
         const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
         if (data?.role === 'admin') {
            setRole(data.role)
         } else {
            redirect('/dashboard') // Not admin
         }
      } else {
        redirect('/') // Not logged in
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
  }

  return (
    <DashboardLayout userRole={role}>
      {children}
    </DashboardLayout>
  )
}
