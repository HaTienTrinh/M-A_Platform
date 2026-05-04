// /components/DealCard.tsx
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Bookmark, MapPin, Building2, Eye, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(val: number | null | undefined) {
  if (!val) return 'Undisclosed'
  return `$${(val / 1000000).toFixed(1)}M`
}

export function DealCard({ deal, isVerified }: { deal: any; isVerified: boolean }) {
  const blurClass = isVerified ? '' : 'blur-sm select-none'

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 transition-colors h-full group flex flex-col relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <CardHeader className="pb-4 border-b border-zinc-800/50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[10px] tracking-wider">
              {deal.deal_type}
            </Badge>
            <Badge variant="outline" className="bg-zinc-950 text-zinc-400 border-zinc-800 uppercase text-[10px] tracking-wider">
              {deal.industry}
            </Badge>
            {deal.trending_score > 50 && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <span role="img" aria-label="flame">🔥</span> Trending
              </Badge>
            )}
          </div>
          <button className="text-zinc-500 hover:text-emerald-400 transition-colors p-1" title="Save Deal">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
        
        <Link href={`/deals/${deal.id}`} className="block">
          <CardTitle className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
            {deal.title}
          </CardTitle>
        </Link>
        
        <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium pt-2">
          <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {deal.location}</span>
          <span className="flex items-center"><Building2 className="w-3.5 h-3.5 mr-1" /> ID: {deal.id.substring(0,6).toUpperCase()}</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="grid grid-cols-3 divide-x divide-zinc-800/50 border-b border-zinc-800/50">
          <div className="p-4 flex flex-col items-center text-center">
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase mb-1">Rev (TTM)</p>
            <p className={cn("font-medium text-zinc-200 text-sm", blurClass)}>
              {formatCurrency(deal.revenue_min)}
            </p>
          </div>
          <div className="p-4 flex flex-col items-center text-center">
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase mb-1">EBITDA</p>
            <p className={cn("font-medium text-zinc-200 text-sm", blurClass)}>
              {formatCurrency(deal.ebitda_min)}
            </p>
          </div>
          <div className="p-4 flex flex-col items-center text-center relative">
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase mb-1">Valuation</p>
            <p className={cn("font-medium text-emerald-400 text-sm", blurClass)}>
              {formatCurrency(deal.valuation_min)}
            </p>
          </div>
        </div>

        {!isVerified && (
          <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200/80 text-center flex items-center justify-center gap-2">
             <Eye className="w-3.5 h-3.5" />
             Upgrade to view full metrics
          </div>
        )}

        <div className="p-5 mt-auto">
          <Link href={`/deals/${deal.id}`} className="block w-full">
            <div className="w-full text-center py-2.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 border border-zinc-700 hover:border-emerald-500 text-sm font-medium text-zinc-300 hover:text-white transition-all h-auto">
              View Deal Details
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
