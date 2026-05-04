// /app/kyc/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadCloud, CheckCircle2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'

export default function KYCPage() {
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  
  const [idDoc, setIdDoc] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [businessLicense, setBusinessLicense] = useState<File | null>(null)
  const [shareholderList, setShareholderList] = useState<File | null>(null)
  
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase
        .from('users')
        .select('role, kyc_status')
        .eq('id', session.user.id)
        .single()
        
      if (profile) {
        if (profile.kyc_status === 'pending') {
          // Check if they already have a pending submission
          const { data: submissions } = await supabase
            .from('kyc_submissions')
            .select('id')
            .eq('user_id', session.user.id)
            .in('status', ['pending'])
            
          if (submissions && submissions.length > 0) {
            router.push('/kyc/status')
            return
          }
        } else if (profile.kyc_status === 'verified') {
          router.push('/dashboard')
          return
        }
        setUserRole(profile.role)
      }
      setLoading(false)
    }
    
    init()
  }, [router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, maxSize = 5) => {
    const file = e.target.files?.[0]
    setError('')
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File size must be less than ${maxSize}MB`)
        return
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        setError('File must be JPG, PNG, or PDF')
        return
      }
      setter(file)
    }
  }

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${path}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const { data: { user } } = await supabase.auth.getUser()
    const fullPath = `${user?.id}/${fileName}`

    const { error, data } = await supabase.storage
      .from('kyc-documents')
      .upload(fullPath, file, { cacheControl: '3600', upsert: false })

    if (error) throw error
    return fullPath
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const idUrl = await uploadFile(idDoc!, 'id_doc')
      const selfieUrl = await uploadFile(selfie!, 'selfie')
      let licenseUrl = null
      let shareholderListUrl = null

      if (userRole === 'seller' || userRole === 'buyer') {
         if (businessLicense) {
             licenseUrl = await uploadFile(businessLicense, 'license')
         }
      }

      if (userRole === 'seller' && shareholderList) {
        shareholderListUrl = await uploadFile(shareholderList, 'shareholder_list')
      }

      const { error: dbError } = await supabase
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          id_document_url: idUrl,
          selfie_url: selfieUrl,
          business_license_url: licenseUrl,
          shareholder_list_url: shareholderListUrl,
          status: 'pending'
        })

      if (dbError) throw dbError

      // Update profile status if not already set correctly
      await supabase
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', user.id)

      router.push('/kyc/status')
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex justify-center items-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pt-24 items-center px-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Identity Verification (KYC)</h1>
        <p className="text-zinc-400 mb-8">Please complete your identity verification to access restricted features of DealFlow.</p>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].slice(0, userRole === 'advisor' ? 2 : userRole === 'seller' ? 4 : 3).map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full ${s <= step ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-medium mb-4">Step 1: Government ID</h2>
              <p className="text-sm text-zinc-400 mb-6">Upload a clear picture or scan of your passport, driver&apos;s license, or national ID card.</p>
              
              <Label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {idDoc ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  ) : (
                    <UploadCloud className="w-10 h-10 text-zinc-500 mb-3" />
                  )}
                  <p className="mb-2 text-sm text-zinc-400">
                    {idDoc ? <span className="text-emerald-500 font-medium">{idDoc.name}</span> : <><span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="text-xs text-zinc-500">PNG, JPG or PDF (MAX. 5MB)</p>
                </div>
                <Input id="dropzone-file" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, setIdDoc)} />
              </Label>
              
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!idDoc} className="bg-emerald-600 hover:bg-emerald-500">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-medium mb-4">Step 2: Selfie Verification</h2>
              <p className="text-sm text-zinc-400 mb-6">Upload a clear selfie showing your face. Make sure it matches the photo on your ID document.</p>
              
              <Label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {selfie ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  ) : (
                    <UploadCloud className="w-10 h-10 text-zinc-500 mb-3" />
                  )}
                  <p className="mb-2 text-sm text-zinc-400">
                    {selfie ? <span className="text-emerald-500 font-medium">{selfie.name}</span> : <><span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="text-xs text-zinc-500">PNG or JPG (MAX. 5MB)</p>
                </div>
                <Input id="dropzone-file2" type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, setSelfie)} />
              </Label>
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="border-zinc-800 hover:bg-zinc-800">Back</Button>
                <Button 
                  onClick={() => userRole === 'advisor' ? handleSubmit() : setStep(3)} 
                  disabled={!selfie || submitting} 
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {userRole === 'advisor' ? 'Submit Forms' : 'Continue'} 
                  {userRole !== 'advisor' && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && userRole !== 'advisor' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-medium mb-4">Step 3: Business Information</h2>
              <p className="text-sm text-zinc-400 mb-6">As a {userRole}, please upload your business license or certificate of incorporation (optional but recommended).</p>
              
              <Label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {businessLicense ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  ) : (
                    <UploadCloud className="w-10 h-10 text-zinc-500 mb-3" />
                  )}
                  <p className="mb-2 text-sm text-zinc-400">
                    {businessLicense ? <span className="text-emerald-500 font-medium">{businessLicense.name}</span> : <><span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="text-xs text-zinc-500">PNG, JPG or PDF (MAX. 5MB)</p>
                </div>
                <Input id="dropzone-file3" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, setBusinessLicense)} />
              </Label>
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="border-zinc-800 hover:bg-zinc-800" disabled={submitting}>Back</Button>
                <Button 
                  onClick={() => userRole === 'seller' ? setStep(4) : handleSubmit()} 
                  disabled={submitting} 
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : userRole === 'seller' ? 'Continue' : 'Complete Submission'}
                  {userRole === 'seller' && !submitting && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && userRole === 'seller' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-medium mb-4">Step 4: Shareholder List</h2>
              <p className="text-sm text-zinc-400 mb-6">Upload a document listing all shareholders with equity %. This helps verify ownership structure.</p>
              
              <Label className="flex flex-col items-center justify-center w-full h-48 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {shareholderList ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                  ) : (
                    <UploadCloud className="w-10 h-10 text-zinc-500 mb-3" />
                  )}
                  <p className="mb-2 text-sm text-zinc-400">
                    {shareholderList ? <span className="text-emerald-500 font-medium">{shareholderList.name}</span> : <><span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop</>}
                  </p>
                  <p className="text-xs text-zinc-500">PDF only (MAX. 10MB)</p>
                </div>
                <Input id="dropzone-file4" type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, setShareholderList, 10)} />
              </Label>
              
              <div className="mt-8 flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)} className="border-zinc-800 hover:bg-zinc-800" disabled={submitting}>Back</Button>
                <Button onClick={handleSubmit} disabled={!shareholderList || submitting} className="bg-emerald-600 hover:bg-emerald-500">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : 'Complete Submission'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
