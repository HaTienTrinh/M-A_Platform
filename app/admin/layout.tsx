'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation' // Dùng useRouter thay vì redirect trực tiếp trong useEffect
import { Loader2, ShieldAlert } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const supabase = createSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/')
          return
        }

        // Truy vấn đúng cột 'role' trong bảng 'users'
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (data?.role === 'admin') {
          setRole(data.role)
          setIsAuthorized(true)
        } else {
          // Nếu không phải admin, đẩy về dashboard chung
          router.push('/dashboard')
        }
      } catch (err) {
        console.error("Auth Error:", err)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [supabase, router])

  // 2. Giao diện Loading đồng bộ "Hacker style"
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">
          Authenticating Admin Access...
        </p>
      </div>
    )
  }

  // 3. Nếu không có quyền, không render gì cả (tránh lộ UI)
  if (!isAuthorized) return null

  return (
    <DashboardLayout userRole={role}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </div>
    </DashboardLayout>
  )
}