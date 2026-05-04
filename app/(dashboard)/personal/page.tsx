'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProfile } from '@/lib/use-profile'

export default function PersonalProfilePage() {
  const supabase = createSupabaseClient()
  const { profile, loading: profileLoading } = useProfile()
  
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    kyc_status: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        role: profile.role || 'buyer',
        kyc_status: profile.kyc_status || 'pending'
      })
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          role: formData.role
        })
        .eq('id', user.id)

      if (error) throw error
      
      // Update auth metadata if full_name or role changed
      await supabase.auth.updateUser({
        data: { full_name: formData.full_name, role: formData.role }
      })
      
      toast.success("Personal profile updated successfully.")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-emerald-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
           <h1 className="text-3xl font-bold flex items-center"><User className="w-8 h-8 mr-3 text-emerald-500" /> Personal Profile</h1>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription className="text-zinc-400">Manage your personal details and account status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Doe" className="bg-zinc-950 border-zinc-800" required />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" value={formData.email} disabled className="bg-zinc-950 border-zinc-800 opacity-70 cursor-not-allowed" />
                  <p className="text-xs text-zinc-500">Email address cannot be changed.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Account Role</Label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} disabled className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                       <option value="buyer">Buyer / Investor</option>
                       <option value="seller">Seller / Business Owner</option>
                       <option value="advisor">M&A Advisor</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kyc_status">KYC Status</Label>
                    <Input id="kyc_status" name="kyc_status" value={formData.kyc_status === 'verified' ? 'Verified' : formData.kyc_status.replace('_', ' ').charAt(0).toUpperCase() + formData.kyc_status.replace('_', ' ').slice(1)} disabled className="bg-zinc-950 border-zinc-800 opacity-70 cursor-not-allowed uppercase" />
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-zinc-800">
                <Button type="submit" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white" disabled={saving}>
                  {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
