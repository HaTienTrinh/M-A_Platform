'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  tax_id: z.string().min(1, 'Tax ID is required'),
  registration_country: z.string().min(1, 'Registration country is required'),
  founded_year: z.number().min(1800).max(new Date().getFullYear()),
  company_industry: z.string().min(1, 'Industry is required'),
  products_services: z.string().min(10, 'Please provide at least 10 characters'),
  target_market: z.string().min(1, 'Target market is required'),
  employees_count: z.string().min(1, 'Employee count is required'),
  founder_pct: z.number().min(0).max(100),
  investor_pct: z.number().min(0).max(100),
  esop_pct: z.number().min(0).max(100),
})

type CompanyFormData = z.infer<typeof companySchema>

const INDUSTRIES = [
  'Tech',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Education',
  'Other',
]

const EMPLOYEE_RANGES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
]

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'Hong Kong',
  'Japan',
  'South Korea',
  'India',
  'Vietnam',
  'Other',
]

export default function CreateCompanyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      founder_pct: 0,
      investor_pct: 0,
      esop_pct: 0,
    },
  })

  const founderPct = watch('founder_pct') || 0
  const investorPct = watch('investor_pct') || 0
  const esopPct = watch('esop_pct') || 0
  const totalPct = founderPct + investorPct + esopPct
  const isOwnershipValid = totalPct === 100

  const nextStep = async () => {
    let fieldsToValidate: (keyof CompanyFormData)[] = []
    
    if (step === 1) {
      fieldsToValidate = ['name', 'tax_id', 'registration_country', 'founded_year']
    } else if (step === 2) {
      fieldsToValidate = ['company_industry', 'products_services', 'target_market', 'employees_count']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const onSubmit = async (data: CompanyFormData) => {
    if (!isOwnershipValid) {
      toast.error('Ownership percentages must sum to exactly 100%')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      
      if (!res.ok) {
        toast.error(result.error ?? 'Failed to create company')
        return
      }
      
      toast.success('Company profile created successfully!')
      router.push('/dashboard')
    } catch (err) {
      toast.error('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const progressPercentage = (step / 3) * 100

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col pt-24 items-center px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold">Create Company Profile</h1>
          </div>
          <p className="text-zinc-400">Complete your company information to list deals</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm">
            <span className={step >= 1 ? 'text-emerald-500 font-medium' : 'text-zinc-500'}>Legal Info</span>
            <span className={step >= 2 ? 'text-emerald-500 font-medium' : 'text-zinc-500'}>Operations</span>
            <span className={step >= 3 ? 'text-emerald-500 font-medium' : 'text-zinc-500'}>Ownership</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Step 1: Legal Information'}
              {step === 2 && 'Step 2: Operations'}
              {step === 3 && 'Step 3: Ownership Structure'}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === 1 && 'Provide your company legal details'}
              {step === 2 && 'Tell us about your business operations'}
              {step === 3 && 'Define your ownership structure'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Legal Info */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="name">Legal Entity Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Acme Corporation Inc."
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-400">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / Business Registration Number *</Label>
                    <Input
                      id="tax_id"
                      {...register('tax_id')}
                      placeholder="12-3456789"
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.tax_id && (
                      <p className="text-sm text-red-400">{errors.tax_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_country">Registration Country *</Label>
                    <select
                      id="registration_country"
                      {...register('registration_country')}
                      className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.registration_country && (
                      <p className="text-sm text-red-400">{errors.registration_country.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founded_year">Founded Year *</Label>
                    <Input
                      id="founded_year"
                      type="number"
                      {...register('founded_year', { valueAsNumber: true })}
                      placeholder="2020"
                      min="1800"
                      max={new Date().getFullYear()}
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.founded_year && (
                      <p className="text-sm text-red-400">{errors.founded_year.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Operations */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="company_industry">Industry *</Label>
                    <select
                      id="company_industry"
                      {...register('company_industry')}
                      className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRIES.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                    {errors.company_industry && (
                      <p className="text-sm text-red-400">{errors.company_industry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="products_services">Products/Services Description *</Label>
                    <textarea
                      id="products_services"
                      {...register('products_services')}
                      placeholder="Describe what your company does..."
                      rows={4}
                      className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {errors.products_services && (
                      <p className="text-sm text-red-400">{errors.products_services.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_market">Target Market *</Label>
                    <Input
                      id="target_market"
                      {...register('target_market')}
                      placeholder="e.g., B2B SaaS, Enterprise, SMBs"
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.target_market && (
                      <p className="text-sm text-red-400">{errors.target_market.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employees_count">Number of Employees *</Label>
                    <select
                      id="employees_count"
                      {...register('employees_count')}
                      className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select range</option>
                      {EMPLOYEE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                    {errors.employees_count && (
                      <p className="text-sm text-red-400">{errors.employees_count.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Ownership */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-zinc-400 mb-2">
                      Ownership percentages must sum to exactly 100%
                    </p>
                    <div className={`text-2xl font-bold ${isOwnershipValid ? 'text-emerald-500' : 'text-red-500'}`}>
                      Total: {totalPct}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founder_pct">Founder Equity % *</Label>
                    <Input
                      id="founder_pct"
                      type="number"
                      {...register('founder_pct', { valueAsNumber: true })}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.founder_pct && (
                      <p className="text-sm text-red-400">{errors.founder_pct.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investor_pct">Investor Equity % *</Label>
                    <Input
                      id="investor_pct"
                      type="number"
                      {...register('investor_pct', { valueAsNumber: true })}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.investor_pct && (
                      <p className="text-sm text-red-400">{errors.investor_pct.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="esop_pct">ESOP % *</Label>
                    <Input
                      id="esop_pct"
                      type="number"
                      {...register('esop_pct', { valueAsNumber: true })}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {errors.esop_pct && (
                      <p className="text-sm text-red-400">{errors.esop_pct.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-zinc-800">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="border-zinc-800 hover:bg-zinc-800"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto bg-emerald-600 hover:bg-emerald-500"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isOwnershipValid || submitting}
                    className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Company Profile'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
