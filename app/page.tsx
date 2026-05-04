// /app/page.tsx
'use client'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, BarChart3, Users, Building } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingDeals } from '@/components/TrendingDeals'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    async function checkUser() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error("Auth error:", error)
        }
        setUser(data?.user || null)
      } catch (e) {
        console.error("Failed to check user auth:", e)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const features = [
    {
      title: "Vetted Listings",
      description: "Every deal goes through strict KYC and preliminary financial checks.",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Secure NDA Flow",
      description: "One-click digital NDAs protect seller confidentiality instantly.",
      icon: <Building className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Deep Analytics",
      description: "Interactive visual data rooms to speed up due diligence.",
      icon: <BarChart3 className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Direct Access",
      description: "Connect safely with verified founders and serious investors.",
      icon: <Users className="w-6 h-6 text-emerald-500" />
    }
  ]

  if (loading) return null

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/50 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
               <span className="text-zinc-950 font-black text-lg">D</span>
            </div>
            DealFlow
          </div>
          <div className="flex items-center gap-4">
            {user ? (
               <Link href="/dashboard" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-500")}>Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "text-zinc-300 hover:text-white")}>Sign In</Link>
                <Link href="/register" className={cn(buttonVariants(), "bg-emerald-600 hover:bg-emerald-500")}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
          Now accepting Q3 listings
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl leading-tight">
          The private market for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">premium</span> businesses.
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          DealFlow connects successful founders with top-tier acquirers. Secure data rooms, integrated NDAs, and vetted participants.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
           {user ? (
             <Link href="/deals" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20")}>Browse Opportunities <ArrowRight className="ml-2 w-5 h-5" /></Link>
           ) : (
             <>
               <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20")}>Create an Account <ArrowRight className="ml-2 w-5 h-5" /></Link>
               <Link href="/deals" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-14 px-8 text-base border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white")}>Browse Public Teasers</Link>
             </>
           )}
        </div>
      </section>

      {/* Trending Section */}
      <div className="max-w-6xl mx-auto">
        <TrendingDeals isVerified={!!user} />
      </div>

      {/* Features */}
      <section className="py-24 bg-zinc-900 border-y border-zinc-800 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A modern M&A experience</h2>
            <p className="text-zinc-400 text-lg">Built for the complexity of mid-market transactions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-zinc-500 text-sm">
        <p>© 2026 DealFlow Platform. Confidential.</p>
      </footer>
    </div>
  )
}
