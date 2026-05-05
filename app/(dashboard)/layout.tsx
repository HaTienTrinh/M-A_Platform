'use client'

import { useProfile } from '@/lib/use-profile'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Loader2 } from 'lucide-react'

export default function DashboardGroupBoundary({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile()

  // 1. Hiệu ứng loading đồng bộ với style "Hacker" của hệ thống
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  // 2. Truyền profile?.role (đảm bảo lấy từ cột 'role' trong DB) vào Layout
  // Nếu profile chưa có role, mặc định sẽ là 'buyer' để tránh lỗi giao diện
  return (
    <DashboardLayout userRole={profile?.role || 'buyer'}>
      <div className="animate-in fade-in duration-500">
        {children}
      </div>
    </DashboardLayout>
  )
}