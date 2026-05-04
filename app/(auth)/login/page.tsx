"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Vui lòng thiết lập biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong mục Settings -> Secrets.')
      }

      // Check rate limit on server before proceeding
      const rateLimitRes = await fetch('/api/auth/login', { method: 'POST' })
      if (rateLimitRes.status === 429) {
        const { error: rateError } = await rateLimitRes.json()
        throw new Error(rateError)
      }

      if (loginMethod === 'password') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        if (data.session) {
          const mfaData = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
          if (mfaData.data && mfaData.data.nextLevel === 'aal2' && mfaData.data.currentLevel === 'aal1') {
            router.push('/verify-otp')
            return
          }
        }
        window.location.href = '/dashboard'
      } else {
        const { error: signInOtpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false
          }
        })
        if (signInOtpError) throw signInOtpError
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
      }
    } catch (err: any) {
      setError(err.message || 'Error logging in.')
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
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLinkedInLogin = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('Please set up NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Settings -> Secrets.')
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: { 
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
          scopes: 'openid profile email'
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-semibold tracking-tight">Sign In</h3>
        <p className="text-muted-foreground text-sm">Access your secure deal room and dashboard.</p>
      </div>

      <div className="space-y-3">
        {/* SSO Buttons */}
        <div className="grid grid-cols-1 gap-3">
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
            Continue with Google
          </Button>

          {process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === 'true' && (
            <Button 
              variant="outline"
              onClick={handleLinkedInLogin} 
              className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] text-white h-12 rounded-lg font-medium hover:bg-[#004182] border-0 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              Continue with LinkedIn
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 py-2 text-zinc-600">
          <div className="h-[1px] flex-grow bg-zinc-800"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">OR USE CREDENTIALS</span>
          <div className="h-[1px] flex-grow bg-zinc-800"></div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">{error}</div>}
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div className="text-[11px] bg-amber-500/10 text-amber-500 p-3 rounded-lg border border-amber-500/20">
              Warning: Supabase credentials not found. Please configure them in Settings &gt; Secrets.
            </div>
          )}
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
          {loginMethod === 'password' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</Label>
                <Link href="#" className="text-[11px] text-emerald-500 hover:underline">Forgot?</Link>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border-zinc-800 h-11 px-4 rounded-lg focus-visible:ring-emerald-500/50 text-sm"
              />
            </div>
          )}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 rounded-lg font-semibold transition-all mt-4"
          >
            {loading ? 'Processing...' : (loginMethod === 'password' ? 'Log In to Deal Room' : 'Send OTP')}
          </Button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            className="text-xs text-zinc-500 hover:text-emerald-500 transition-colors"
            onClick={() => setLoginMethod(m => m === 'password' ? 'otp' : 'password')}
          >
            {loginMethod === 'password' ? 'Log in with Email OTP instead' : 'Log in with Password instead'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500">
        Don&apos;t have an account? <Link href="/register" className="text-emerald-500 font-medium hover:underline">Register Firm</Link>
      </p>

      {/* Trust Indicators */}
      <div className="pt-8 flex justify-center gap-8 opacity-40">
         <div className="text-[10px] border border-zinc-700 px-2 py-1 rounded">256-BIT AES</div>
         <div className="text-[10px] border border-zinc-700 px-2 py-1 rounded">ISO 27001</div>
         <div className="text-[10px] border border-zinc-700 px-2 py-1 rounded">MFA ENABLED</div>
      </div>
    </>
  )
}

