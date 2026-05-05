'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Menu,
  LayoutTemplate,
  User,
  Building2,
  LogOut,
  ShieldCheck,
  Briefcase,
  Fingerprint,
  Search,
  Bell
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationBell } from '@/components/NotificationBell'
import { cn } from '@/lib/utils'

export function DashboardLayout({ children, userRole }: { children: React.ReactNode, userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* Brand Logo - Phong cách M&A Platform */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-900 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/20">
            M
          </div>
          <span className="text-xl font-black text-white tracking-tighter uppercase">
            M&A <span className="text-emerald-500">PLATFORM</span>
          </span>
        </div>
      </div>

      {/* Sidebar Menu */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-3 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 font-mono">System</p>
        
        {/* Dashboard chính */}
        <Link 
          href="/dashboard" 
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
            pathname === '/dashboard' ? "bg-emerald-500/10 text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          )}
        >
          <LayoutTemplate className={cn("w-5 h-5 mr-3 transition-colors", pathname === '/dashboard' ? "text-emerald-500" : "group-hover:text-emerald-400")} />
          <span className="flex-1 font-medium text-[13px]">Dashboard</span>
          {pathname === '/dashboard' && <div className="w-1 h-4 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
        </Link>

        {/* Hồ sơ cá nhân */}
        <Link 
          href="/personal" 
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
            pathname === '/personal' ? "bg-emerald-500/10 text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
          )}
        >
          <User className={cn("w-5 h-5 mr-3 transition-colors", pathname === '/personal' ? "text-emerald-500" : "group-hover:text-emerald-400")} />
          <span className="flex-1 font-medium text-[13px]">Hồ sơ cá nhân</span>
          {pathname === '/personal' && <div className="w-1 h-4 bg-emerald-500 rounded-full" />}
        </Link>

        {/* Thương vụ cho User (Seller/Buyer/Advisor) */}
        {(userRole === 'seller' || userRole === 'buyer' || userRole === 'investor' || userRole === 'advisor') && (
          <Link 
            href="/listings" 
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "group flex items-center px-3 py-2.5 rounded-lg transition-all",
              pathname === '/listings' ? "bg-emerald-500/10 text-emerald-500" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <Briefcase className="w-5 h-5 mr-3" />
            <span className="flex-1 text-[13px]">{userRole === 'seller' ? 'Danh sách tin đăng' : 'Các thương vụ của tôi'}</span>
          </Link>
        )}

        {/* Quản trị viên (Admin Section) */}
        {userRole === 'admin' && (
          <div className="mt-8 space-y-1.5 border-t border-zinc-900 pt-4">
            <p className="px-3 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 font-mono">Administrator</p>
            
            {/* Quản trị Dashboard */}
            <Link 
              href="/admin" 
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2.5 rounded-lg transition-all",
                pathname === '/admin' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500" />
              <span className="flex-1 text-[13px]">Admin Dashboard</span>
            </Link>

            {/* Quản lý người dùng */}
            <Link 
              href="/admin/users" 
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2.5 rounded-lg transition-all",
                pathname.startsWith('/admin/users') ? "bg-zinc-900 text-white border border-zinc-800" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              <User className="w-5 h-5 mr-3 text-emerald-500" />
              <span className="flex-1 text-[13px]">Quản lý người dùng</span>
            </Link>

            {/* Quản lý thương vụ (Admin Deals) */}
            <Link 
              href="/admin/deals" 
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center px-3 py-2.5 rounded-lg transition-all",
                pathname.startsWith('/admin/deals') ? "bg-zinc-900 text-white border border-zinc-800" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              <Building2 className="w-5 h-5 mr-3 text-emerald-500" />
              <span className="flex-1 text-[13px]">Kiểm duyệt Deals</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Phần Đăng xuất */}
      <div className="p-4 border-t border-zinc-900 bg-[#09090b]">
        <button onClick={handleSignout} className="w-full flex items-center px-3 py-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all group">
          <LogOut className="w-5 h-5 mr-3 group-hover:translate-x-1 transition-transform" />
          <span className="font-bold text-[11px] uppercase tracking-wider">Sign Out System</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-black text-zinc-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar (Desktop & Mobile) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#09090b] border-r border-zinc-900 z-50 transition-transform duration-300 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Vùng nội dung chính */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar mờ ảo chuẩn Cyber */}
        <header className="h-16 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="p-2 -ml-2 text-zinc-400 hover:text-white md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
               <span className="text-emerald-500 animate-pulse">●</span> Core System Ready
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NotificationBell />
            {/* User Profile Tag */}
            <div className="flex items-center gap-3 p-1 pr-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20">
                <Fingerprint className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter group-hover:text-white transition-colors">
                Role: {userRole || 'Unauthorized'}
              </span>
            </div>
          </div>
        </header>

        {/* Nội dung trang */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-10 custom-scrollbar animate-in fade-in duration-700">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}