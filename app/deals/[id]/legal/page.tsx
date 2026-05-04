// /app/deals/[id]/legal/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, FileText, CheckCircle, Clock, PenTool, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import LegalClientWrapper from './LegalClientWrapper'

export default async function LegalHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login')

  const { data: userProfile } = await supabase.from('users').select('*').eq('id', authData.user.id).single()

  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal) return <div>Deal not found.</div>

  const isSeller = deal.seller_id === authData.user.id
  let hasAccess = isSeller

  // Buyers need an NDA even to exist here? No, they come here to *sign* the NDA!
  // If they are a buyer, they can only see legal_documents related to their NDA requests or signatures
  const { data: documents } = await supabase
    .from('legal_documents')
    .select('*, document_signatures(*)')
    .eq('deal_id', id)
    .order('created_at', { ascending: false })

  const { data: sellerProfile } = await supabase.from('users').select('*').eq('id', deal.seller_id).single()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/deals/${id}`} className="text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{deal.title} - Legal Hub</h1>
            <p className="text-xs text-zinc-500">Document Generation & E-Signatures</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-8">
         <LegalClientWrapper 
            deal={deal} 
            documents={documents || []} 
            isSeller={isSeller} 
            userId={authData.user.id} 
            userFullName={userProfile?.full_name || userProfile?.email} 
            sellerCompany={sellerProfile?.company_name || 'Seller Inc.'}
         />
      </main>
    </div>
  )
}
