'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [supabase])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read_at).length)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return

    fetchNotifications()

    const channel = supabase.channel('notifications_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(count => count + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchNotifications])

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
      setUnreadCount(0)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'relative text-zinc-400 hover:text-white'
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800 p-0">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <span className="font-semibold text-zinc-100">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-transparent">
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
             <div className="py-8">
               <EmptyState
                 icon="🔔"
                 title="No notifications"
                 description="You're all caught up! Notifications will appear here."
               />
             </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${!n.read_at ? 'bg-indigo-500/5' : ''}`}>
                 <div className="flex justify-between items-start mb-1">
                   <h4 className={`text-sm font-medium ${!n.read_at ? 'text-zinc-100' : 'text-zinc-300'}`}>{n.title}</h4>
                   {!n.read_at && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5"></span>}
                 </div>
                 <p className="text-xs text-zinc-400 mb-2">{n.body}</p>
                 <span className="text-[10px] text-zinc-500">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
