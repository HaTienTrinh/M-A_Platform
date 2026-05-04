// /app/deals/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { FilterSidebar } from '@/components/FilterSidebar'
import { SearchBar } from '@/components/SearchBar'
import { DealCard } from '@/components/DealCard'
import { EmptyState } from '@/components/EmptyState'
import { FolderSearch, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DealsBrowsePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const supabase = await createSupabaseServer()
  
  // KYC checking -> blurred financials if not kyc_verified
  const { data: userData } = await supabase.auth.getUser()
  let isVerified = false
  if (userData.user) {
    const { data: profile } = await supabase.from('users').select('kyc_status').eq('id', userData.user.id).single()
    isVerified = profile?.kyc_status === 'verified'
  }

  const { search, industries, types, sort, minRevenue, page } = await searchParams
  const currentPage = parseInt(page ?? '1')

  let query = supabase.from('deals').select('*', { count: 'exact' }).in('status', ['active', 'under_offer'])

  if (search) {
     query = query.or(`title.ilike.%${search}%,industry.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (industries) {
     const indArray = industries.split(',').map(i => i.trim())
     query = query.in('industry', indArray)
  }

  if (types) {
     const typesArray = types.split(',').map(t => t.trim())
     query = query.in('deal_type', typesArray)
  }

  if (minRevenue) {
    // minRevenue is in millions
     query = query.gte('revenue_max', parseInt(minRevenue) * 1000000)
  }

  if (sort === 'valuation_desc') {
    query = query.order('valuation_max', { ascending: false, nullsFirst: false })
  } else if (sort === 'revenue_desc') {
    query = query.order('revenue_max', { ascending: false, nullsFirst: false })
  } else if (sort === 'trending') {
    query = query.order('trending_score', { ascending: false })
  } else {
    // newest
    query = query.order('created_at', { ascending: false })
  }

  const limit = 20
  const offset = (currentPage - 1) * limit

  const { data: deals, error, count } = await query.range(offset, offset + limit - 1)

  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / limit)
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  // Build pagination URLs
  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (industries) params.set('industries', industries)
    if (types) params.set('types', types)
    if (sort) params.set('sort', sort)
    if (minRevenue) params.set('minRevenue', minRevenue)
    params.set('page', newPage.toString())
    return `/deals?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
      {/* Header section */}
      <div className="bg-zinc-900 border-b border-zinc-800 pt-12 pb-10 px-6 shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Deal Discovery</h1>
            <p className="text-zinc-400 max-w-xl text-base md:text-lg">
              Explore premium M&A opportunities. Filter by industry, revenue, and valuation to find your next strategic acquisition.
            </p>
          </div>
          
          <div className="w-full md:w-auto flex-1 max-w-2xl flex justify-end">
             <SearchBar />
          </div>
        </div>
      </div>

      {!isVerified && userData.user && (
         <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
               <AlertTriangle className="w-5 h-5 text-amber-500" />
               <p className="text-sm text-amber-200">
                 Complete your <span className="font-semibold text-amber-500">KYC Verification</span> to view unblurred numbers and access detailed due diligence.
               </p>
               <Link href="/settings" className="text-xs ml-4 bg-amber-500 text-amber-950 font-bold px-3 py-1.5 rounded-md hover:bg-amber-400 transition-colors">
                  Verify Now
               </Link>
            </div>
         </div>
      )}

      {/* Main Layout Grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
         
         {/* Sidebar Filter */}
         <aside className="w-full lg:w-72 shrink-0">
            <FilterSidebar />
         </aside>

         {/* Content Area */}
         <main className="flex-1 w-full min-w-0">
            
            <div className="flex justify-between items-center mb-6">
               <p className="text-zinc-400 font-medium">
                  Showing <span className="text-white">{deals?.length || 0}</span> of <span className="text-white">{totalCount}</span> opportunities
               </p>
               {totalPages > 1 && (
                 <p className="text-zinc-500 text-sm">
                   Page {currentPage} of {totalPages}
                 </p>
               )}
            </div>

            {!deals || deals.length === 0 ? (
               <EmptyState
                 icon="🏢"
                 title="No deals found"
                 description="Try adjusting your filters or check back later for new opportunities."
               />
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                 {deals.map(deal => (
                   <div key={deal.id}>
                     <DealCard deal={deal} isVerified={isVerified} />
                   </div>
                 ))}
               </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && deals && deals.length > 0 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'border-zinc-800 hover:bg-zinc-800',
                    !hasPrev && 'pointer-events-none opacity-50'
                  )}
                  aria-disabled={!hasPrev}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Link>

                <div className="flex items-center gap-2 px-4">
                  {currentPage > 2 && (
                    <Link href={buildPageUrl(1)} className="px-3 py-2 text-sm rounded-md hover:bg-zinc-800 transition-colors">
                      1
                    </Link>
                  )}
                  {currentPage > 3 && <span className="text-zinc-600">...</span>}
                  
                  {hasPrev && (
                    <Link href={buildPageUrl(currentPage - 1)} className="px-3 py-2 text-sm rounded-md hover:bg-zinc-800 transition-colors">
                      {currentPage - 1}
                    </Link>
                  )}
                  
                  <span className="px-3 py-2 text-sm rounded-md bg-emerald-600 font-medium">
                    {currentPage}
                  </span>
                  
                  {hasNext && (
                    <Link href={buildPageUrl(currentPage + 1)} className="px-3 py-2 text-sm rounded-md hover:bg-zinc-800 transition-colors">
                      {currentPage + 1}
                    </Link>
                  )}
                  
                  {currentPage < totalPages - 2 && <span className="text-zinc-600">...</span>}
                  {currentPage < totalPages - 1 && (
                    <Link href={buildPageUrl(totalPages)} className="px-3 py-2 text-sm rounded-md hover:bg-zinc-800 transition-colors">
                      {totalPages}
                    </Link>
                  )}
                </div>

                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'border-zinc-800 hover:bg-zinc-800',
                    !hasNext && 'pointer-events-none opacity-50'
                  )}
                  aria-disabled={!hasNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
            
         </main>
      </div>
    </div>
  )
}
