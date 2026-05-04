// /app/deals/FilterSidebar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tag, MapPin, Building, Activity, RotateCcw } from 'lucide-react'

const INDUSTRIES = [
  'Software', 'Hardware', 'Healthcare', 'Fintech', 
  'E-commerce', 'Manufacturing', 'Real Estate', 'B2B Services'
]

const DEAL_TYPES = [
  'Full Acquisition', 'Majority Stake', 'Minority Stake', 'Asset Sale'
]

export function FilterSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read directly from URL params
  const industriesParam = searchParams.get('industries')
  const industries = industriesParam ? industriesParam.split(',') : []
  
  const typesParam = searchParams.get('types')
  const dealTypes = typesParam ? typesParam.split(',') : []
  
  const sortBy = searchParams.get('sort') ?? 'newest'
  const minRev = parseInt(searchParams.get('minRevenue') ?? '0')

  // Update URL with new filter value
  const updateFilter = (key: string, value: string | string[] | number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','))
      } else {
        params.delete(key)
      }
    } else if (value && value !== 'newest' && value !== 0) {
      params.set(key, value.toString())
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filters change
    params.set('page', '1')
    router.push(`/deals?${params.toString()}`)
  }

  const toggleIndustry = (industry: string) => {
    const newIndustries = industries.includes(industry) 
      ? industries.filter(i => i !== industry) 
      : [...industries, industry]
    updateFilter('industries', newIndustries)
  }

  const toggleType = (type: string) => {
    const newTypes = dealTypes.includes(type) 
      ? dealTypes.filter(t => t !== type) 
      : [...dealTypes, type]
    updateFilter('types', newTypes)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('industries')
    params.delete('types')
    params.delete('sort')
    params.delete('minRevenue')
    params.set('page', '1')
    router.push(`/deals?${params.toString()}`)
  }

  return (
    <div className="w-full h-full bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-8 sticky top-24">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-bold text-white tracking-tight flex items-center"><FilterIcon className="w-4 h-4 mr-2" /> Filters</h2>
         <button onClick={clearFilters} className="text-xs text-zinc-500 hover:text-white flex items-center transition-colors">
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
         </button>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest flex items-center">
            <Activity className="w-3.5 h-3.5 mr-2 text-zinc-500" /> Sort By
        </h3>
        <RadioGroup value={sortBy} onValueChange={(val) => updateFilter('sort', val)} className="flex flex-col gap-2.5">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="newest" id="r1" className="border-zinc-700 data-[state=checked]:text-emerald-500 data-[state=checked]:border-emerald-500" />
            <Label htmlFor="r1" className="text-sm text-zinc-400 font-normal">Newest Postings</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="trending" id="r4" className="border-zinc-700 data-[state=checked]:text-emerald-500 data-[state=checked]:border-emerald-500" />
            <Label htmlFor="r4" className="text-sm text-zinc-400 font-normal flex items-center gap-1.5"><span role="img" aria-label="flame">🔥</span> Hot & Trending</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="valuation_desc" id="r2" className="border-zinc-700 data-[state=checked]:text-emerald-500 data-[state=checked]:border-emerald-500" />
            <Label htmlFor="r2" className="text-sm text-zinc-400 font-normal">Highest Valuation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="revenue_desc" id="r3" className="border-zinc-700 data-[state=checked]:text-emerald-500 data-[state=checked]:border-emerald-500" />
            <Label htmlFor="r3" className="text-sm text-zinc-400 font-normal">Highest Revenue</Label>
          </div>
        </RadioGroup>
      </div>

      <hr className="border-zinc-800/80" />

      {/* Deal Type */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest flex items-center">
            <Tag className="w-3.5 h-3.5 mr-2 text-zinc-500" /> Deal Type
        </h3>
        <div className="space-y-2.5">
          {DEAL_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox 
                id={`type-${type}`} 
                checked={dealTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
                className="border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <Label htmlFor={`type-${type}`} className="text-sm text-zinc-400 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-zinc-800/80" />

      {/* Industry */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest flex items-center">
            <Building className="w-3.5 h-3.5 mr-2 text-zinc-500" /> Industry
        </h3>
        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
          {INDUSTRIES.map(industry => (
            <div key={industry} className="flex items-center space-x-2">
              <Checkbox 
                id={`ind-${industry}`} 
                checked={industries.includes(industry)}
                onCheckedChange={() => toggleIndustry(industry)}
                className="border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded-[4px]"
              />
              <Label htmlFor={`ind-${industry}`} className="text-sm text-zinc-400 font-normal leading-none">
                {industry}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-zinc-800/80" />

      {/* Revenue Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest flex items-center">
                Min. Revenue
            </h3>
            <span className="text-xs text-emerald-400 font-medium">
               {minRev === 0 ? 'Any' : minRev >= 1000 ? `$${minRev/1000}M+` : minRev >= 1 ? `$${minRev}M+` : `< $1M`}
            </span>
        </div>
        <Slider
          defaultValue={[minRev]}
          max={50}
          step={1}
          value={[minRev]}
          onValueChange={(val) => updateFilter('minRevenue', val[0])}
          className="py-2"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
           <span>$0</span>
           <span>$25M</span>
           <span>$50M+</span>
        </div>
      </div>

      <div className="text-xs text-zinc-500 text-center mt-2">
        Filters update instantly
      </div>
    </div>
  )
}

function FilterIcon(props: any) {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}
