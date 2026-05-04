// /app/deals/[id]/negotiate/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShieldAlert } from 'lucide-react'
import NegotiateClientWrapper from './NegotiateClientWrapper'

type RelatedUser = {
  full_name?: string | null
  email?: string | null
}

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function NegotiatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('*').eq('id', authData.user.id).single()

  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal) return <div>Deal not found.</div>

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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-zinc-400 max-w-md mx-auto mb-8">
          You need an approved NDA to access the Negotiation Room for this deal. Please request an NDA from the deal details page.
        </p>
        <Link href={`/deals/${id}`} className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-500 font-medium transition-colors">
          Return to Deal Details
        </Link>
      </div>
    )
  }

  // Get conversation partners
  let partnerId = ''
  let partnerName = ''

  if (isSeller) {
     // A seller shouldn't be in the base negotiate page without a specific buyer. 
     // For demo, if seller accesses this, we redirect them to pick a buyer, or default to the first approved NDA buyer.
     const { data: ndas } = await supabase
       .from('nda_requests')
       .select('buyer_id, users(full_name, email)')
       .eq('deal_id', id)
       .eq('status', 'approved')
     
     if (ndas && ndas.length > 0) {
        partnerId = ndas[0].buyer_id
        const buyer = firstRelated(ndas[0].users as RelatedUser | RelatedUser[] | null)
        partnerName = buyer?.full_name || buyer?.email || 'Buyer'
     } else {
        return <div className="p-8 text-white">No approved buyers to negotiate with yet.</div>
     }
  } else {
     partnerId = deal.seller_id
     const { data: seller } = await supabase.from('users').select('*').eq('id', deal.seller_id).single()
     partnerName = seller?.company_name || seller?.full_name || seller?.email || 'Seller'
  }

  const buyerId = isSeller ? partnerId : authData.user.id
  const sellerId = isSeller ? authData.user.id : partnerId

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/deals/${id}`} className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{deal.title}</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                 Secure Negotiate
              </span>
            </div>
            <p className="text-xs text-zinc-500">Negotiating with {partnerName}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
         <NegotiateClientWrapper 
            dealId={deal.id}
            dealTitle={deal.title}
            userId={authData.user.id}
            userFullName={userProfile?.full_name || userProfile?.email}
            buyerId={buyerId}
            sellerId={sellerId}
            partnerId={partnerId}
            partnerName={partnerName}
            isSeller={isSeller}
         />
      </main>
    </div>
  )
}
