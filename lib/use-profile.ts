'use client'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

export type Profile = {
  id: string
  email: string
  full_name: string
  country: string | null
  role: 'buyer' | 'seller' | 'advisor' | 'admin'
  kyc_status: 'pending' | 'verified' | 'rejected'
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createSupabaseClient()

    async function fetchProfile() {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (!mounted) return

      if (userError || !user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, country, role, kyc_status')
        .eq('id', user.id)
        .single()

      if (!mounted) return

      if (data) {
        setProfile(data as Profile)
      } else {
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          country: null,
          role: user.user_metadata?.role || 'buyer',
          kyc_status: 'pending'
        })
      }
      setLoading(false)
    }

    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // INITIAL_SESSION fires on mount — skip it, fetchProfile() above already handles it
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchProfile()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { profile, loading }
}
