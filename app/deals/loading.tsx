// /app/deals/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingDealsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
      {/* Header section Skeleton */}
      <div className="bg-zinc-900 border-b border-zinc-800 pt-12 pb-10 px-6 shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 bg-zinc-800" />
            <Skeleton className="h-6 w-full max-w-xl bg-zinc-800" />
          </div>
          
          <div className="w-full md:w-auto flex-1 max-w-2xl flex justify-end">
             <Skeleton className="h-14 w-full bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
         
         {/* Sidebar Filter Component is client side, let's just let it load or show skeleton */}
         <aside className="w-full lg:w-72 shrink-0">
            <div className="w-full h-[600px] bg-zinc-950 border border-zinc-800 rounded-xl p-5">
               <Skeleton className="w-32 h-6 bg-zinc-800 mb-8" />
               <div className="space-y-6">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="space-y-3">
                       <Skeleton className="w-24 h-4 bg-zinc-800" />
                       <Skeleton className="w-full h-24 bg-zinc-800/50" />
                    </div>
                 ))}
               </div>
            </div>
         </aside>

         {/* Content Area Skeleton */}
         <main className="flex-1 w-full min-w-0">
            <div className="flex justify-between items-center mb-6">
               <Skeleton className="h-5 w-32 bg-zinc-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-[280px] rounded-xl bg-zinc-900 border border-zinc-800/80 p-0 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-zinc-800">
                      <div className="flex gap-2 mb-4">
                         <Skeleton className="w-20 h-5 bg-zinc-800 rounded-md" />
                         <Skeleton className="w-24 h-5 bg-zinc-800 rounded-md" />
                      </div>
                      <Skeleton className="w-full h-6 bg-zinc-800 mb-2" />
                      <Skeleton className="w-3/4 h-6 bg-zinc-800 mb-4" />
                      <div className="flex gap-4">
                        <Skeleton className="w-20 h-4 bg-zinc-800" />
                        <Skeleton className="w-20 h-4 bg-zinc-800" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 flex">
                        <Skeleton className="w-full h-full bg-zinc-800/50" />
                    </div>
                 </div>
              ))}
            </div>
         </main>
      </div>
    </div>
  )
}
