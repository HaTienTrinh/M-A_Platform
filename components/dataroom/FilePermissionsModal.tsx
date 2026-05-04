import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type RelatedUser = {
  full_name?: string | null
  email?: string | null
}

function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function FilePermissionsModal({ file, open, onOpenChange }: { file: any, open: boolean, onOpenChange: (o: boolean) => void }) {
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [buyers, setBuyers] = useState<any[]>([])
  
  useEffect(() => {
    async function load() {
      if (!open || !file) return
      setLoading(true)
      
      // Get all approved buyers for this deal
      const { data: ndas } = await supabase
        .from('nda_requests')
        .select('buyer_id, users(full_name, email)')
        .eq('deal_id', file.deal_id)
        .eq('status', 'approved')
        
      // Get existing permissions for this file
      const { data: perms } = await supabase
        .from('dataroom_permissions')
        .select('*')
        .eq('file_id', file.id)

      if (ndas) {
        setBuyers(ndas.map(nda => {
          const p = perms?.find(x => x.user_id === nda.buyer_id)
          const buyer = firstRelated(nda.users as RelatedUser | RelatedUser[] | null)
          return {
            id: nda.buyer_id,
            name: buyer?.full_name || buyer?.email || 'Unknown',
            permission_level: p ? p.permission_level : 'view_only' // Default is view_only implicitly
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [open, file, supabase])

  const togglePermission = async (buyerId: string, currentLevel: string) => {
    const newLevel = currentLevel === 'view_only' ? 'download' : 'view_only'
    
    // Optimistic update
    setBuyers(b => b.map(x => x.id === buyerId ? { ...x, permission_level: newLevel } : x))
    
    const { error } = await supabase
      .from('dataroom_permissions')
      .upsert({
         file_id: file.id,
         user_id: buyerId,
         permission_level: newLevel
      }, { onConflict: 'file_id,user_id' })
      
    if (error) {
      toast.error("Failed to update permission")
      // Revert
      setBuyers(b => b.map(x => x.id === buyerId ? { ...x, permission_level: currentLevel } : x))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <div className="text-sm text-zinc-400 mt-2">
            File: {file?.filename}
          </div>
        </DialogHeader>
        
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {loading ? (
             <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
          ) : buyers.length === 0 ? (
             <div className="text-zinc-500 text-center text-sm py-4">No approved buyers for this deal yet.</div>
          ) : (
            buyers.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                 <div className="flex flex-col">
                   <span className="font-medium">{b.name}</span>
                   <span className="text-xs text-zinc-500">
                     {b.permission_level === 'download' ? 'Enable Download' : 'View Only'}
                   </span>
                 </div>
                 <Switch 
                   checked={b.permission_level === 'download'} 
                   onCheckedChange={() => togglePermission(b.id, b.permission_level)}
                   className="data-[state=checked]:bg-emerald-500"
                 />
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="bg-zinc-900 border-zinc-700">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
