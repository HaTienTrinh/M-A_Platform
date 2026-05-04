// /app/deals/SearchBar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [term, setTerm] = useState('')

  useEffect(() => {
    setTerm(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }
    
    // Reset to page 1 when search changes
    params.set('page', '1')
    router.push(`/deals?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative flex w-full max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
      <Input 
        placeholder="Search deals by title, industry, or keyword..." 
        className="pl-12 h-14 bg-zinc-900 border-zinc-700 focus:border-emerald-500 text-base rounded-r-none rounded-l-xl text-white shadow-sm"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <Button type="submit" className="h-14 px-8 rounded-l-none rounded-r-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm">
         Search
      </Button>
    </form>
  )
}
