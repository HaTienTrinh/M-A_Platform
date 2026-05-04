"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Vui lòng thiết lập biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong mục Settings -> Secrets.')
      }

      // 1. Sign up the user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      // 2. Safely create their profile record in the database using Admin key
      if (data.user) {
        const res = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            fullName,
            role
          }),
        })

        const profileData = await res.json()

        if (!res.ok) {
          throw new Error(profileData.error || 'Database error saving new user profile')
        }
      }

      setSuccess('Account created successfully! Please check your email to verify or sign in.')
    } catch (err: any) {
      setError(err.message || 'Error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Vui lòng thiết lập biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong mục Settings -> Secrets.')
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-semibold tracking-tight">Register Firm</h3>
        <p className="text-muted-foreground text-sm">Join the global standard for M&A execution.</p>
      </div>

      <div className="space-y-4">
        {/* SSO Button */}
        <Button 
          variant="outline"
          onClick={handleGoogleLogin} 
          className="w-full flex items-center justify-center gap-3 bg-zinc-50 text-zinc-950 h-12 rounded-lg font-medium hover:bg-zinc-200 hover:text-zinc-950 border-0 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Register with Google
        </Button>

        <div className="flex items-center gap-4 py-2 text-zinc-600">
          <div className="h-[1px] flex-grow bg-zinc-800"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">OR REGISTER VIA EMAIL</span>
          <div className="h-[1px] flex-grow bg-zinc-800"></div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}
          {success && <div className="text-sm font-medium text-emerald-500">{success}</div>}
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Full Name</Label>
            <Input 
              type="text" 
              placeholder="Jane Doe" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full bg-zinc-950 border-zinc-800 h-11 px-4 rounded-lg focus-visible:ring-emerald-500/50 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Business Email</Label>
            <Input 
              type="email" 
              placeholder="name@firm.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border-zinc-800 h-11 px-4 rounded-lg focus-visible:ring-emerald-500/50 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-950 border-zinc-800 h-11 px-4 rounded-lg focus-visible:ring-emerald-500/50 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">I am a...</Label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-zinc-950 border-zinc-800 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
            >
              <option value="buyer">Buyer / Investor</option>
              <option value="seller">Seller / Business Owner</option>
              <option value="advisor">M&A Advisor</option>
            </select>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 rounded-lg font-semibold transition-all mt-4"
          >
            {loading ? 'Creating Account...' : 'Register Firm'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Already have an account? <Link href="/login" className="text-emerald-500 font-medium hover:underline">Sign In</Link>
      </p>

      {/* Trust Indicators */}
      <div className="pt-8 flex justify-center gap-8 opacity-40">
         <div className="text-[10px] border border-zinc-700 px-2 py-1 rounded">256-BIT AES</div>
         <div className="text-[10px] border border-zinc-700 px-2 py-1 rounded">ISO 27001</div>
         <div className="text-[10px] border border-zinc-700 px-2 py-1 rounded">KYC VERIFIED</div>
      </div>
    </>
  )
}
