"use client"

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

function VerifyOtpContent() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationType, setVerificationType] = useState<'totp' | 'email_otp'>('totp')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailQuery = searchParams.get('email')
  const supabase = createSupabaseClient()

  useEffect(() => {
    const checkStatus = async () => {
      const { data } = await supabase.auth.getSession()
      
      if (emailQuery && !data.session) {
        setVerificationType('email_otp')
      } else if (data.session) {
        const mfa = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (mfa.data && mfa.data.nextLevel === 'aal2' && mfa.data.currentLevel === 'aal1') {
          setVerificationType('totp')
        } else {
          router.push('/')
        }
      }
    }
    checkStatus()
  }, [emailQuery, router, supabase.auth])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (verificationType === 'email_otp' && emailQuery) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: emailQuery,
          token: code,
          type: 'email'
        })
        if (otpError) throw otpError
      } else if (verificationType === 'totp') {
        const factors = await supabase.auth.mfa.listFactors()
        const totpFactor = factors.data?.totp?.[0]
        
        if (!totpFactor) throw new Error("No TOTP factor found for this user.")

        const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
        if (challenge.error) throw challenge.error

        const verify = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challenge.data.id,
          code
        })

        if (verify.error) throw verify.error
      }
      
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-semibold tracking-tight">Two-Factor Authentication</h3>
        <p className="text-muted-foreground text-sm">
          {verificationType === 'totp' 
            ? 'Enter the 6-digit code from your authenticator app.' 
            : `Enter the code sent to ${emailQuery || 'your email'}.`}
        </p>
      </div>

      <div className="space-y-4">
        <form onSubmit={handleVerify} className="space-y-4">
          {error && <div className="text-sm font-medium text-destructive">{error}</div>}
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Verification Code</Label>
            <Input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code} 
              onChange={e => setCode(e.target.value)} 
              required 
              placeholder="000000"
              className="w-full bg-zinc-950 border-zinc-800 h-16 px-4 rounded-lg focus-visible:ring-emerald-500/50 text-center text-3xl tracking-[1em] font-mono"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 rounded-lg font-semibold transition-all mt-4"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-500">
        <button type="button" onClick={() => router.push('/login')} className="text-emerald-500 font-medium hover:underline">Back to sign in</button>
      </p>
    </>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  )
}
