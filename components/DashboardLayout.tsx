'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Menu,
  Search,
  Bell,
  LayoutTemplate,
  User,
  Building2,
  LogOut,
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationBell } from '@/components/NotificationBell'

export function DashboardLayout({ children, userRole }: { children: React.ReactNode, userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutTemplate },
    { name: 'Personal Profile', href: '/personal', icon: User },
  ]

  const SidebarContent = () => (
    <>
      {/* Brand Logo */}
      <div className="h-14 flex items-center px-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center mr-3 border border-emerald-500/30">
           <span className="font-bold text-emerald-500 text-lg">D</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tight">DealFlow</span>
      </div>

      {/* Sidebar Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        <Link 
          href="/dashboard" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname === '/dashboard' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <LayoutTemplate className="w-5 h-5 mr-3" />
          <span className="flex-1">Dashboard</span>
        </Link>
        
        <Link 
          href="/personal" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname === '/personal' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <User className="w-5 h-5 mr-3" />
          <span className="flex-1">Personal Profile</span>
        </Link>

        {(userRole === 'seller' || userRole === 'buyer' || userRole === 'investor' || userRole === 'advisor') && (
          <Link 
            href="/listings" 
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname === '/listings' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Building2 className="w-5 h-5 mr-3" />
            <span className="flex-1">{userRole === 'seller' ? 'My Listings' : 'My Deals'}</span>
          </Link>
        )}

        {(userRole === 'seller' || (!userRole && pathname === '/profile')) && (
          <Link 
            href="/profile" 
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname === '/profile' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            <Building2 className="w-5 h-5 mr-3" />
            <span className="flex-1">Business Profile</span>
          </Link>
        )}

        <Link 
          href="/settings" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname === '/settings' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="flex-1">Settings</span>
        </Link>

        {userRole === 'admin' && (
          <>
            <div className="pt-8 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin</div>
            <Link 
              href="/admin" 
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname === '/admin' ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <LayoutTemplate className="w-5 h-5 mr-3" />
              <span className="flex-1">Admin Dashboard</span>
            </Link>
            <Link 
              href="/admin/users" 
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname.startsWith('/admin/users') ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <User className="w-5 h-5 mr-3" />
              <span className="flex-1">User Management</span>
            </Link>
            <Link 
              href="/admin/deals" 
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${pathname.startsWith('/admin/deals') ? 'bg-emerald-600/10 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Building2 className="w-5 h-5 mr-3" />
              <span className="flex-1">Deal Moderation</span>
            </Link>
          </>
        )}
        
        <div className="pt-8 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</div>
        
        <button onClick={handleSignout} className="w-full flex items-center px-3 py-2.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left">
          <LogOut className="w-5 h-5 mr-3" />
          <span className="flex-1">Sign Out</span>
        </button>
      </nav>
    </>
  )

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-[280px] bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-[250px] bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-zinc-950">
        {/* Topbar */}
        <header className="h-14 bg-zinc-900/50 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="hidden sm:flex gap-4 text-sm font-medium text-zinc-400">
              <Link href="/deals" className="hover:text-zinc-200">Browse Deals</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3 text-zinc-400">
            <NotificationBell />
            <div className="flex items-center gap-2 ml-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700">
                 <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 w-full mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
