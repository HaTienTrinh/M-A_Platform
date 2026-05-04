// /app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Save, Loader2, History } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type ProfileVersion = {
  id: string
  created_at: string
  profile_data?: {
    company_name?: string
    profile_visibility?: string
    company_industry?: string
    employees_count?: string
  } | null
}

export default function BusinessProfilePage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    company_name: '',
    tax_id: '',
    registration_country: '',
    company_website: '',
    company_industry: '',
    products_services: '',
    target_market: '',
    company_description: '',
    founded_year: '',
    employees_count: '',
    founder_pct: '0',
    investor_pct: '0',
    esop_pct: '0',
    profile_visibility: 'private'
  })

  const [apiError, setApiError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ProfileVersion[]>([])
  const totalOwnership = (parseInt(formData.founder_pct) || 0) + (parseInt(formData.investor_pct) || 0) + (parseInt(formData.esop_pct) || 0)
  const ownershipRemaining = 100 - totalOwnership

  const fetchVersions = async () => {
     const { data: { user } } = await supabase.auth.getUser()
     if (user) {
        const { data } = await supabase.from('business_profile_versions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        setVersions(data || [])
     }
  }

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        // Try to fetch company specific data if it exists
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('seller_id', user.id)
          .single()

        setFormData({
          company_name: data.company_name || companyData?.name || '',
          tax_id: data.tax_id || '',
          registration_country: data.registration_country || '',
          company_website: data.company_website || '',
          company_industry: data.company_industry || '',
          products_services: data.products_services || '',
          target_market: data.target_market || '',
          company_description: data.company_description || '',
          founded_year: data.founded_year || '',
          employees_count: data.employees_count || '',
          founder_pct: companyData?.founder_pct?.toString() || data.owner_founder_percent?.toString() || '0',
          investor_pct: companyData?.investor_pct?.toString() || data.owner_investor_percent?.toString() || '0',
          esop_pct: companyData?.esop_pct?.toString() || data.owner_esop_percent?.toString() || '0',
          profile_visibility: data.profile_visibility || 'private'
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (totalOwnership !== 100) {
      toast.error('Ownership percentages must sum exactly to 100%.')
      return
    }

    setSaving(true)
    setApiError(null)

    if (totalOwnership !== 100) {
      setApiError("Ownership percentages must sum to exactly 100%")
      setSaving(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const profilePayload = {
        name: formData.company_name,
        founder_pct: parseInt(formData.founder_pct) || 0,
        investor_pct: parseInt(formData.investor_pct) || 0,
        esop_pct: parseInt(formData.esop_pct) || 0,
      };

      // Use the new API Route (Layer 2)
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      // Also update the users table for backward compatibility if needed, 
      // or just keep them in sync if the project uses both
      await supabase
        .from('users')
        .update({
          company_name: formData.company_name,
          tax_id: formData.tax_id,
          registration_country: formData.registration_country,
          company_website: formData.company_website,
          company_industry: formData.company_industry,
          products_services: formData.products_services,
          target_market: formData.target_market,
          company_description: formData.company_description,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          employees_count: formData.employees_count,
          owner_founder_percent: profilePayload.founder_pct,
          owner_investor_percent: profilePayload.investor_pct,
          owner_esop_percent: profilePayload.esop_pct,
          profile_visibility: formData.profile_visibility
        })
        .eq('id', user.id)

      toast.success("Business profile updated successfully.")
      router.push('/dashboard')
    } catch (e: any) {
      setApiError(e.message)
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-emerald-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
           <h1 className="text-3xl font-bold flex items-center"><Building2 className="w-8 h-8 mr-3 text-emerald-500" /> Business Profile</h1>
           
           <Dialog>
             <DialogTrigger
               onClick={fetchVersions}
               className={cn(
                 buttonVariants({ variant: 'outline' }),
                 "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 h-10 px-4 py-2"
               )}
             >
               <History className="w-4 h-4 mr-2" /> Version History
             </DialogTrigger>
             <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50 max-h-[80vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle>Profile Version History</DialogTitle>
               </DialogHeader>
               <div className="mt-4 space-y-4">
                  {versions.length === 0 ? (
                     <p className="text-sm text-zinc-500 text-center py-4">No version history available.</p>
                  ) : (
                     <div className="space-y-4">
                        {versions.map((ver, idx) => (
                           <div key={ver.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-emerald-400 text-sm">Version {versions.length - idx}</span>
                                <span className="text-xs text-zinc-500">{new Date(ver.created_at).toLocaleString()}</span>
                              </div>
                              <div className="text-xs text-zinc-400 space-y-1 mt-2">
                                 <p><strong>Name:</strong> {ver.profile_data?.company_name}</p>
                                 <p><strong>Visibility:</strong> <span className="capitalize">{ver.profile_data?.profile_visibility || 'Private'}</span></p>
                                 <p><strong>Industry:</strong> {ver.profile_data?.company_industry || 'N/A'}</p>
                                 <p><strong>Employees:</strong> {ver.profile_data?.employees_count || 'N/A'}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
             </DialogContent>
           </Dialog>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription className="text-zinc-400">Complete your business profile. This information will be used to generate your teaser and data room context.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center border-b border-zinc-800 pb-2">1. Legal & Privacy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company_name">Legal Entity Name</Label>
                    <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Acme Corp LLC" className="bg-zinc-950 border-zinc-800" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profile_visibility">Profile Visibility</Label>
                    <select id="profile_visibility" name="profile_visibility" value={formData.profile_visibility} onChange={handleChange} className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                       <option value="private">Private (Only you & admins)</option>
                       <option value="anonymous">Anonymous (Hide name & exact details)</option>
                       <option value="public">Public (Visible to verified buyers)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tax_id">Tax ID / Registration Number</Label>
                    <Input id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleChange} placeholder="e.g. 0123456789" className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="registration_country">Registration Country</Label>
                    <Input id="registration_country" name="registration_country" value={formData.registration_country} onChange={handleChange} placeholder="e.g. United States, Vietnam" className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="founded_year">Founded Year</Label>
                    <Input id="founded_year" name="founded_year" type="number" min="1800" max="2100" value={formData.founded_year} onChange={handleChange} placeholder="e.g. 2018" className="bg-zinc-950 border-zinc-800" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-zinc-100 flex items-center border-b border-zinc-800 pb-2 pt-4">2. Operational Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company_industry">Industry (Taxonomy)</Label>
                    <Input id="company_industry" name="company_industry" value={formData.company_industry} onChange={handleChange} placeholder="e.g. B2B SaaS, Healthcare" className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_website">Website</Label>
                    <Input id="company_website" name="company_website" type="url" value={formData.company_website} onChange={handleChange} placeholder="https://example.com" className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="employees_count">Company Size</Label>
                    <select id="employees_count" name="employees_count" value={formData.employees_count} onChange={handleChange} className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50">
                       <option value="">Select size</option>
                       <option value="1-10">1-10 employees</option>
                       <option value="11-50">11-50 employees</option>
                       <option value="51-200">51-200 employees</option>
                       <option value="201-500">201-500 employees</option>
                       <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="products_services">Products / Services</Label>
                  <Input id="products_services" name="products_services" value={formData.products_services} onChange={handleChange} placeholder="Briefly list core products or services" className="bg-zinc-950 border-zinc-800" />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="target_market">Target Market</Label>
                  <Input id="target_market" name="target_market" value={formData.target_market} onChange={handleChange} placeholder="Who are your customers?" className="bg-zinc-950 border-zinc-800" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company_description">Company Description / Overview</Label>
                  <Textarea id="company_description" name="company_description" value={formData.company_description} onChange={handleChange} className="bg-zinc-950 border-zinc-800 min-h-[100px]" placeholder="Briefly describe your company's core operations." />
                </div>

                <h3 className="text-lg font-semibold text-zinc-100 flex items-center border-b border-zinc-800 pb-2 pt-4">3. Ownership Structure</h3>
                
                <div className={cn(
                  "p-3 rounded-lg mb-4 text-sm font-medium flex justify-between items-center",
                  totalOwnership === 100 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                )}>
                  <span>Total Ownership: {totalOwnership}%</span>
                  <span>{totalOwnership === 100 ? "Ready to save" : ownershipRemaining > 0 ? `Needs ${ownershipRemaining}% more` : `Overage by ${Math.abs(ownershipRemaining)}%`}</span>
                </div>

                {apiError && (
                  <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg mb-4 text-xs">
                    {apiError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="founder_pct">Founder (%)</Label>
                    <Input id="founder_pct" name="founder_pct" type="number" min="0" max="100" value={formData.founder_pct} onChange={handleChange} placeholder="e.g. 60" className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="investor_pct">Investor (%)</Label>
                    <Input id="investor_pct" name="investor_pct" type="number" min="0" max="100" value={formData.investor_pct} onChange={handleChange} placeholder="e.g. 30" className="bg-zinc-950 border-zinc-800" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="esop_pct">ESOP (%)</Label>
                    <Input id="esop_pct" name="esop_pct" type="number" min="0" max="100" value={formData.esop_pct} onChange={handleChange} placeholder="e.g. 10" className="bg-zinc-950 border-zinc-800" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" disabled={saving || totalOwnership !== 100}>
                  {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Business Profile</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
