'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { 
  Briefcase, Building2, Save, Send, Link as LinkIcon, 
  MapPin, DollarSign, Calculator, Target, 
  FileText, TrendingUp, CheckCircle2, ChevronRight, Loader2, PlayCircle, Eye, UploadCloud, X
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const dealSchema = z.object({
  title: z.string().min(1, "Headline is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),

  revenue_y1: z.coerce.number().optional(),
  revenue_y2: z.coerce.number().optional(),
  revenue_y3: z.coerce.number().optional(),
  ebitda: z.coerce.number().optional(),
  net_profit: z.coerce.number().optional(),
  growth_rate: z.coerce.number().optional(),
  currency: z.string().default('USD'),

  deal_type: z.string().min(1),
  valuation: z.coerce.number().optional(),
  equity_pct: z.coerce.number().optional(),
  min_ticket: z.coerce.number().optional(),

  reason: z.string().optional(),
  future_plans: z.string().optional(),
  strengths: z.string().optional() // we'll split by newline
})

type DealFormInput = z.input<typeof dealSchema>
type DealFormValues = z.output<typeof dealSchema>

export default function CreateDealSubmission() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [activeSection, setActiveSection] = useState('section-a')
  const [dealId, setDealId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // File upload states
  const [pitchDeck, setPitchDeck] = useState<File | null>(null)
  const [finReport, setFinReport] = useState<File | null>(null)
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const { register, handleSubmit, watch, formState: { errors }, getValues, reset } = useForm<DealFormInput, unknown, DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      currency: 'USD',
      deal_type: 'Full acquisition'
    }
  })

  // Load existing draft on mount
  useEffect(() => {
    async function loadDraft() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existingDraft } = await supabase
        .from('deals')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingDraft) {
        setDealId(existingDraft.id)
        
        // Pre-fill form with saved draft
        const draftData = existingDraft.ownership_structure || {}
        reset({
          title: existingDraft.title || '',
          industry: draftData.industry || existingDraft.industry || '',
          country: draftData.country || '',
          city: draftData.city || '',
          revenue_y1: draftData.revenue_y1,
          revenue_y2: draftData.revenue_y2,
          revenue_y3: draftData.revenue_y3,
          ebitda: draftData.ebitda,
          net_profit: draftData.net_profit,
          growth_rate: draftData.growth_rate,
          currency: draftData.currency || 'USD',
          deal_type: existingDraft.deal_type || 'Full acquisition',
          valuation: draftData.valuation,
          equity_pct: draftData.equity_pct,
          min_ticket: draftData.min_ticket,
          reason: draftData.reason || '',
          future_plans: draftData.future_plans || '',
          strengths: Array.isArray(draftData.strengths) ? draftData.strengths.join('\n') : ''
        })
        
        setLastSaved(new Date(existingDraft.updated_at))
        toast.success('Loaded your previous draft')
        
        // Load uploaded documents
        const { data: docs } = await supabase
          .from('deal_documents')
          .select('*')
          .eq('deal_id', existingDraft.id)
        if (docs) setUploadedFiles(docs)
      }
    }
    loadDraft()
  }, [supabase, reset])

  // Start autosave
  const formValues = watch()
  
  const saveDraft = React.useCallback(async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const strengthsArray = getValues('strengths')?.split('\n').filter(s => s.trim() !== '') || []

      const payload = {
        title: getValues('title'),
        industry: getValues('industry'),
        country: getValues('country'),
        city: getValues('city'),
        revenue_y1: getValues('revenue_y1'),
        revenue_y2: getValues('revenue_y2'),
        revenue_y3: getValues('revenue_y3'),
        ebitda: getValues('ebitda'),
        net_profit: getValues('net_profit'),
        growth_rate: getValues('growth_rate'),
        currency: getValues('currency'),
        deal_type: getValues('deal_type'),
        valuation: getValues('valuation'),
        equity_pct: getValues('equity_pct'),
        min_ticket: getValues('min_ticket'),
        reason: getValues('reason'),
        future_plans: getValues('future_plans'),
        strengths: strengthsArray,
      }

      let returnedId = dealId

      if (dealId) {
        const res = await fetch(`/api/deals/${dealId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
           const data = await res.json()
           throw new Error(data.error || 'Failed to update deal')
        }
      } else {
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create deal')
        if (data && data.id) {
          setDealId(data.id)
          returnedId = data.id
        }
      }
      setLastSaved(new Date())
      return returnedId
    } catch (e) {
      console.error(e)
      return null
    } finally {
      setSaving(false)
    }
  }, [dealId, getValues, supabase])

  // Auto-save every 30 seconds
  useEffect(() => {
    // Only auto-save if we have basic info
    if (!formValues.title) return

    const interval = setInterval(() => {
      saveDraft()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [formValues, saveDraft])

  const handleDocumentUpload = async (file: File, type: string) => {
    let currentDealId = dealId
    if (!currentDealId) {
       if (!getValues('title') || !getValues('industry') || !getValues('country') || !getValues('city')) {
         toast.error("Please fill in Basic Info (Headline, Industry, Country, City) first so we can save a draft.")
         return
       }
       currentDealId = await saveDraft()
       if (!currentDealId) {
         toast.error("Failed to save draft.")
         return
       }
    }

    setDocsLoading(true)
    try {
       const fileExt = file.name.split('.').pop()
       const filePath = `${currentDealId}/${Math.random()}.${fileExt}`
       
       const { error } = await supabase.storage.from('deal_documents').upload(filePath, file)
       if (error) throw error

       const { data, error: dbError } = await supabase.from('deal_documents').insert({
         deal_id: currentDealId,
         title: `${type} - ${file.name}`,
         document_url: filePath
       }).select().single()

       if (dbError) throw dbError

       setUploadedFiles([...uploadedFiles, data])
       toast.success("Document uploaded successfully.")
    } catch (e: any) {
       toast.error("Upload failed: " + e.message)
    } finally {
       setDocsLoading(false)
    }
  }

  const removeDocument = async (id: string, path: string) => {
     try {
       await supabase.storage.from('deal_documents').remove([path])
       await supabase.from('deal_documents').delete().eq('id', id)
       setUploadedFiles(uploadedFiles.filter(f => f.id !== id))
     } catch (e: any) {
       toast.error(e.message)
     }
  }

  const onSubmit = async (_data: DealFormValues) => {
    const finalDealId = await saveDraft()
    
    if (finalDealId) {
      const { error } = await supabase.from('deals').update({ status: 'submitted' }).eq('id', finalDealId)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Deal submitted successfully! Our team will review it shortly.")
        window.location.href = '/deals'
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-500/30">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
               <X className="w-5 h-5" />
             </Link>
             <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>
             <div className="flex items-center gap-2">
               <span className="font-semibold text-white">New Submission</span>
               <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-widest hidden sm:inline-block">DRAFT</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {saving ? (
               <span className="flex items-center text-xs text-zinc-500"><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Saving...</span>
             ) : lastSaved ? (
               <span className="flex items-center text-xs text-zinc-500"><CheckCircle2 className="w-3 h-3 mr-1.5 text-emerald-500" /> Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
             ) : (
               <span className="text-xs text-zinc-500">Not saved yet</span>
             )}
             
             <Button onClick={() => saveDraft()} variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white h-9 hidden sm:flex">
                Save Draft
             </Button>
             <Button onClick={handleSubmit(onSubmit)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 shadow-lg shadow-emerald-500/10">
               Submit Deal <ArrowRight className="w-4 h-4 ml-1.5" />
             </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Sticky Sidebar Navigation */}
        <nav className="w-full md:w-64 shrink-0 md:sticky md:top-24 hidden md:block">
           <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
             <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                <h3 className="text-sm font-medium text-white uppercase tracking-wider">Submission Guide</h3>
             </div>
             <ul className="p-2 space-y-1 text-sm font-medium">
               <li>
                 <a href="#section-a" className={`flex items-center p-2.5 rounded-lg transition-colors ${activeSection === 'section-a' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                   <Building2 className="w-4 h-4 mr-3 opacity-70" /> A. Basic Info
                 </a>
               </li>
               <li>
                 <a href="#section-b" className={`flex items-center p-2.5 rounded-lg transition-colors ${activeSection === 'section-b' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                   <Calculator className="w-4 h-4 mr-3 opacity-70" /> B. Financial Info
                 </a>
               </li>
               <li>
                 <a href="#section-c" className={`flex items-center p-2.5 rounded-lg transition-colors ${activeSection === 'section-c' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                   <Target className="w-4 h-4 mr-3 opacity-70" /> C. M&A Details
                 </a>
               </li>
               <li>
                 <a href="#section-d" className={`flex items-center p-2.5 rounded-lg transition-colors ${activeSection === 'section-d' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                   <TrendingUp className="w-4 h-4 mr-3 opacity-70" /> D. Strategic Info
                 </a>
               </li>
               <li>
                 <a href="#section-e" className={`flex items-center p-2.5 rounded-lg transition-colors ${activeSection === 'section-e' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                   <FileText className="w-4 h-4 mr-3 opacity-70" /> E. Document Upload
                 </a>
               </li>
             </ul>
           </div>
           
           <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mx-2">
              <h4 className="flex items-center text-blue-400 font-medium text-sm mb-1.5"><Eye className="w-4 h-4 mr-1.5" /> Confidentiality</h4>
              <p className="text-xs text-blue-200/70 leading-relaxed">Your company&apos;s identity and documents remain strictly confidential. Only verified investors who sign an NDA will gain access to Section E documents.</p>
           </div>
        </nav>

        {/* Main Form Content */}
        <main className="flex-1 min-w-0 max-w-3xl space-y-12 pb-32">
          
          <form id="submission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            
            {/* Section A: Basic Info */}
            <section id="section-a" className="scroll-mt-24" onMouseEnter={() => setActiveSection('section-a')}>
              <div className="border-b border-zinc-800 pb-2 mb-6">
                 <h2 className="text-2xl font-semibold text-white tracking-tight">A. Basic Info</h2>
                 <p className="text-zinc-400 text-sm mt-1">High-level details that form your public teaser.</p>
              </div>
              
              <div className="space-y-6 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div>
                  <Label className="text-zinc-300 font-medium mb-2 block">Headline / Teaser Name <span className="text-red-500">*</span></Label>
                  <Input {...register('title')} placeholder="e.g. Project Apollo - High-Growth B2B SaaS" className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 h-11 text-base" />
                  {errors.title && <span className="text-xs text-red-500 mt-1.5 block">{errors.title.message}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">Industry <span className="text-red-500">*</span></Label>
                    <select {...register('industry')} className="flex h-11 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">Select Industry</option>
                      <option value="Software & Tech">Software & Tech</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Consumer Goods">Consumer Goods</option>
                      <option value="Financial Services">Financial Services</option>
                    </select>
                    {errors.industry && <span className="text-xs text-red-500 mt-1.5 block">{errors.industry.message}</span>}
                  </div>
                  <div></div>
                  
                  <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">Country <span className="text-red-500">*</span></Label>
                    <Input {...register('country')} placeholder="e.g. Vietnam" className="bg-zinc-950 border-zinc-800 h-11" />
                    {errors.country && <span className="text-xs text-red-500 mt-1.5 block">{errors.country.message}</span>}
                  </div>
                  <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">City <span className="text-red-500">*</span></Label>
                    <Input {...register('city')} placeholder="e.g. Ho Chi Minh City" className="bg-zinc-950 border-zinc-800 h-11" />
                    {errors.city && <span className="text-xs text-red-500 mt-1.5 block">{errors.city.message}</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Section B: Financial Info */}
            <section id="section-b" className="scroll-mt-24" onMouseEnter={() => setActiveSection('section-b')}>
              <div className="border-b border-zinc-800 pb-2 mb-6 flex justify-between items-end">
                 <div>
                   <h2 className="text-2xl font-semibold text-white tracking-tight">B. Financial Info</h2>
                   <p className="text-zinc-400 text-sm mt-1">Key financial metrics to evaluate profitability and scale.</p>
                 </div>
                 <div className="w-32">
                    <Label className="sr-only">Currency</Label>
                    <select {...register('currency')} className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 font-mono text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase">
                      <option value="USD">USD ($)</option>
                      <option value="VND">VND (₫)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                 </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                
                <h3 className="text-sm font-semibold text-emerald-400 mb-4 tracking-wide uppercase">Historical Revenue</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div>
                    <Label className="text-zinc-400 font-medium mb-2 block text-xs">Year 1 (e.g. 2023)</Label>
                    <Input type="number" {...register('revenue_y1')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 font-medium mb-2 block text-xs">Year 2 (e.g. 2024)</Label>
                    <Input type="number" {...register('revenue_y2')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 font-medium mb-2 block text-xs">Year 3 (e.g. LTM)</Label>
                    <Input type="number" {...register('revenue_y3')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                </div>

                <div className="w-full h-px bg-zinc-800 mb-8"></div>

                <h3 className="text-sm font-semibold text-zinc-300 mb-4 tracking-wide uppercase">Profitability & Growth</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-zinc-400 font-medium mb-2 block text-xs">LTM EBITDA</Label>
                    <Input type="number" {...register('ebitda')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 font-medium mb-2 block text-xs">LTM Net Profit</Label>
                    <Input type="number" {...register('net_profit')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 font-medium mb-2 block text-xs">YoY Growth Rate (%)</Label>
                    <div className="relative">
                      <Input type="number" {...register('growth_rate')} placeholder="0" className="bg-zinc-950 border-zinc-800 font-mono pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Section C: M&A Details */}
            <section id="section-c" className="scroll-mt-24" onMouseEnter={() => setActiveSection('section-c')}>
              <div className="border-b border-zinc-800 pb-2 mb-6">
                 <h2 className="text-2xl font-semibold text-white tracking-tight">C. M&A Details</h2>
                 <p className="text-zinc-400 text-sm mt-1">Transaction structure and expectation parameters.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                 
                 <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">Deal Type Structure <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       <label className="flex items-center cursor-pointer">
                          <input type="radio" value="Full acquisition" {...register('deal_type')} className="sr-only peer" />
                          <div className="w-full text-center px-4 py-3 rounded-lg border border-zinc-800 text-zinc-400 peer-checked:bg-emerald-600/10 peer-checked:border-emerald-500/50 peer-checked:text-emerald-400 transition-colors">
                             Full Acquisition (100%)
                          </div>
                       </label>
                       <label className="flex items-center cursor-pointer">
                          <input type="radio" value="Partial stake" {...register('deal_type')} className="sr-only peer" />
                          <div className="w-full text-center px-4 py-3 rounded-lg border border-zinc-800 text-zinc-400 peer-checked:bg-emerald-600/10 peer-checked:border-emerald-500/50 peer-checked:text-emerald-400 transition-colors">
                             Partial Stake
                          </div>
                       </label>
                       <label className="flex items-center cursor-pointer">
                          <input type="radio" value="Investment round" {...register('deal_type')} className="sr-only peer" />
                          <div className="w-full text-center px-4 py-3 rounded-lg border border-zinc-800 text-zinc-400 peer-checked:bg-emerald-600/10 peer-checked:border-emerald-500/50 peer-checked:text-emerald-400 transition-colors">
                             Investment Round
                          </div>
                       </label>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-800">
                  <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">Asking Valuation</Label>
                    <Input type="number" {...register('valuation')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                  <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">Equity Offered (%)</Label>
                    <div className="relative">
                      <Input type="number" {...register('equity_pct')} placeholder="100" className="bg-zinc-950 border-zinc-800 font-mono pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-300 font-medium mb-2 block">Min. Ticket Size</Label>
                    <Input type="number" {...register('min_ticket')} placeholder="0.00" className="bg-zinc-950 border-zinc-800 font-mono" />
                  </div>
                 </div>

              </div>
            </section>

            {/* Section D: Strategic Info */}
            <section id="section-d" className="scroll-mt-24" onMouseEnter={() => setActiveSection('section-d')}>
              <div className="border-b border-zinc-800 pb-2 mb-6">
                 <h2 className="text-2xl font-semibold text-white tracking-tight">D. Strategic Info</h2>
                 <p className="text-zinc-400 text-sm mt-1">The qualitative narrative driving the deal.</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                
                <div>
                  <Label className="text-zinc-300 font-medium mb-2 block">Reason for Selling / Raising</Label>
                  <Textarea {...register('reason')} className="bg-zinc-950 border-zinc-800 min-h-[100px]" placeholder="e.g. Retirement, Seeking capital for expansion, etc." />
                </div>

                <div>
                  <Label className="text-zinc-300 font-medium mb-2 block">Future Plans (Post-Deal)</Label>
                  <Textarea {...register('future_plans')} className="bg-zinc-950 border-zinc-800 min-h-[100px]" placeholder="e.g. Founders willing to stay on for 2-year transition." />
                </div>

                <div>
                  <Label className="text-zinc-300 font-medium mb-2 block flex justify-between items-end">
                     <span>Key Strengths & Moats</span>
                     <span className="text-xs text-zinc-500 font-normal">One per line, up to 5</span>
                  </Label>
                  <Textarea {...register('strengths')} className="bg-zinc-950 border-zinc-800 min-h-[120px] font-mono text-sm leading-relaxed" placeholder="1. Strong recurring revenue (85% retention)&#10;2. Proprietary IP and patents&#10;3. ..." />
                </div>

              </div>
            </section>

             {/* Section E: Document Upload */}
             <section id="section-e" className="scroll-mt-24" onMouseEnter={() => setActiveSection('section-e')}>
              <div className="border-b border-zinc-800 pb-2 mb-6 flex justify-between items-end">
                 <div>
                   <h2 className="text-2xl font-semibold text-white tracking-tight">E. Document Delivery</h2>
                   <p className="text-zinc-400 text-sm mt-1">Upload files securely to your Virtual Data Room (VDR).</p>
                 </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
                 
                 {/* Upload Areas */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pitch Deck */}
                    <div className="border border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-800/50 transition-colors relative">
                       <input 
                         type="file" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         accept=".pdf,.pptx"
                         onChange={(e) => e.target.files && handleDocumentUpload(e.target.files[0], 'Pitch Deck')}
                         disabled={docsLoading}
                       />
                       <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                       <h4 className="text-zinc-300 font-medium mb-1">Upload Pitch Deck</h4>
                       <p className="text-xs text-zinc-500">PDF, PPTX up to 10MB</p>
                    </div>

                    {/* Financials */}
                    <div className="border border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-800/50 transition-colors relative">
                       <input 
                         type="file" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                         accept=".pdf,.xlsx"
                         onChange={(e) => e.target.files && handleDocumentUpload(e.target.files[0], 'Financial Report')}
                         disabled={docsLoading}
                       />
                       <Calculator className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                       <h4 className="text-zinc-300 font-medium mb-1">Financial Report</h4>
                       <p className="text-xs text-zinc-500">PDF, XLSX up to 10MB</p>
                    </div>
                 </div>

                 {/* Uploaded Files List */}
                 {uploadedFiles.length > 0 && (
                   <div className="pt-4 border-t border-zinc-800">
                      <h4 className="text-sm font-medium text-zinc-300 mb-3">Uploaded Documents</h4>
                      <div className="space-y-2">
                         {uploadedFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                               <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-emerald-500" />
                                  <span className="text-sm font-medium text-zinc-300">{file.title}</span>
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => removeDocument(file.id, file.document_url)}
                                 className="text-zinc-500 hover:text-red-400 p-1"
                               >
                                  <X className="w-4 h-4" />
                               </button>
                            </div>
                         ))}
                      </div>
                   </div>
                 )}

              </div>
            </section>

          </form>

        </main>
      </div>
    </div>
  )
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
