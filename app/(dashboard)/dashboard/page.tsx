'use client'
import { useProfile } from '@/lib/use-profile'
import { SellerDashboard } from '@/components/dashboard/SellerDashboard'
import { BuyerDashboard } from '@/components/dashboard/BuyerDashboard'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { profile, loading } = useProfile()
  
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }
  
  if (!profile) return null
  
  if (profile.role === 'seller') return <SellerDashboard />
  if (profile.role === 'buyer') return <BuyerDashboard />
  if (profile.role === 'admin') return <AdminDashboard />
  if (profile.role === 'advisor') return <BuyerDashboard /> // advisors see buyer view
  
  return null
}
