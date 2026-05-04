// /app/kyc/status/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock, ShieldCheck, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/lib/use-profile'

export default function KYCStatusPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const { profile, loading } = useProfile()
  const status = profile?.kyc_status || 'pending'

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pt-32 items-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        
        {status === 'pending' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Verification Processing</h1>
            <p className="text-zinc-400 mb-8">
              Your identity documents have been submitted and are currently being reviewed by our compliance team. This typically takes 1-2 business days.
            </p>
            <Link href="/dashboard" className={cn(buttonVariants(), "w-full bg-zinc-800 hover:bg-zinc-700 text-white")}>
              Return to Dashboard
            </Link>
          </div>
        )}

        {status === 'verified' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Identity Verified</h1>
            <p className="text-zinc-400 mb-8">
              Congratulations! Your identity has been successfully verified. You now have full access to DealFlow features, including creating listings and engaging in transactions.
            </p>
            <Link href="/dashboard" className={cn(buttonVariants(), "w-full bg-emerald-600 hover:bg-emerald-500 text-white")}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'rejected' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
            <p className="text-zinc-400 mb-8">
              Unfortunately, we could not verify your identity with the provided documents. Please ensure your photos are clear and the details match your profile.
            </p>
            <Link href="/kyc" className={cn(buttonVariants(), "w-full bg-emerald-600 hover:bg-emerald-500 text-white")}>
              Try Again
            </Link>
          </div>
        )}

        {!['pending', 'verified', 'rejected'].includes(status || '') && (
          <div className="animate-in fade-in zoom-in duration-500">
             <h1 className="text-2xl font-bold mb-4">Not Verified</h1>
             <p className="text-zinc-400 mb-8">You need to verify your identity before proceeding.</p>
             <Link href="/kyc" className={cn(buttonVariants(), "w-full bg-emerald-600 hover:bg-emerald-500 text-white")}>
               Start KYC Verification
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}
