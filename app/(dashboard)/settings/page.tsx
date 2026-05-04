// /app/(dashboard)/settings/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [integration, setIntegration] = useState<any>(null)

  const fetchIntegration = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single()

    setIntegration(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchIntegration()
    
    // Listen for OAuth success via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        fetchIntegration()
        toast.success("Google Calendar connected successfully!")
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [fetchIntegration])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/google-calendar/connect')
      if (!response.ok) throw new Error('Failed to initiate connection')
      
      const { url } = await response.json()
      
      // Open the provider URL directly in a popup
      const width = 600
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      
      window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      )
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar? Meetings will no longer be synced.")) return

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('id', integration.id)

    if (error) {
      toast.error("Failed to disconnect")
    } else {
      setIntegration(null)
      toast.success("Google Calendar disconnected")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardDescription className="text-zinc-400">Connect third-party services to enhance your DealFlow experience.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 border border-zinc-800 rounded-xl bg-zinc-950/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">Google Calendar</h4>
                <p className="text-sm text-zinc-500">Sync meetings, auto-generate Meet links, and invite attendees.</p>
              </div>
            </div>

            <div>
              {loading ? (
                <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
              ) : integration ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Connected ({integration.calendar_email})
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10">
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConnect} disabled={connecting} className="bg-white text-zinc-950 hover:bg-zinc-200">
                  {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Connect Calendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Account Notifications</CardTitle>
          <CardDescription className="text-zinc-400">Manage how you receive updates about your deals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Placeholder for other settings */}
           <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 text-sm">
             Additional notification preferences coming soon.
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
