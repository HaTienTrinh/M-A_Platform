'use client'

import { useProfile } from '@/lib/use-profile'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function DashboardGroupBoundary({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile()

  if (loading) return null

  return (
    <DashboardLayout userRole={profile?.role}>
      {children}
    </DashboardLayout>
  )
}
