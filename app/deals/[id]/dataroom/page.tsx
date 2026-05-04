// /app/deals/[id]/dataroom/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShieldAlert } from 'lucide-react'
import DataRoomClient from './DataRoomClient'

export default async function DataRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    redirect('/login')
  }

  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  
  if (!deal) {
    return <div>Deal not found.</div>
  }

  const isSeller = deal.seller_id === authData.user.id
  let hasAccess = isSeller

  if (!isSeller) {
    const { data: nda } = await supabase
      .from('nda_requests')
      .select('status')
      .eq('deal_id', id)
      .eq('buyer_id', authData.user.id)
      .single()
      
    if (nda?.status === 'approved') {
      hasAccess = true
    }
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Access Restricted</h1>
        <p className="text-zinc-400 max-w-md mx-auto mb-8">
          You need an approved NDA to access the Data Room for this deal.
        </p>
        <Link href={`/deals/${id}`} className="bg-emerald-600 px-6 py-2 rounded-md hover:bg-emerald-500 font-medium transition-colors">
          Return to Deal Details
        </Link>
      </div>
    )
  }

  return (
    <DataRoomClient 
      dealId={id} 
      isSeller={isSeller} 
      userId={authData.user.id} 
      userName={authData.user.email?.split('@')[0] || 'User'} 
    />
  )
}
