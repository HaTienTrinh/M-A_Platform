// /app/demo/page.tsx
'use client'

import React from 'react'
import {
  Menu,
  Search,
  Bell,
  MessageCircle,
  Maximize,
  ShoppingCart,
  BarChart2,
  UserPlus,
  PieChart,
  Circle,
  CircleDot,
  LayoutTemplate,
  Grip,
  Settings,
  Layers,
  FileText,
  Table,
  LogOut,
  Minus,
  X,
  MapPin,
  MoreVertical,
  ChevronRight,
  Database
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import Image from 'next/image'

const chartData = [
  { name: 'Jan 23', visitors: 60, sales: 25 },
  { name: 'Feb 23', visitors: 58, sales: 45 },
  { name: 'Mar 23', visitors: 80, sales: 40 },
  { name: 'Apr 23', visitors: 82, sales: 18 },
  { name: 'May 23', visitors: 56, sales: 85 },
  { name: 'Jun 23', visitors: 55, sales: 30 },
  { name: 'Jul 23', visitors: 40, sales: 90 },
]

const sparklineData1 = [
  { value: 20 }, { value: 30 }, { value: 25 }, { value: 45 }, { value: 35 }, { value: 50 }, { value: 60 }
]
const sparklineData2 = [
  { value: 60 }, { value: 30 }, { value: 55 }, { value: 45 }, { value: 75 }, { value: 50 }, { value: 20 }
]
const sparklineData3 = [
  { value: 30 }, { value: 40 }, { value: 35 }, { value: 55 }, { value: 65 }, { value: 40 }, { value: 70 }
]

export default function AdminLTEDashboard() {
  return (
    <div className="flex h-screen bg-[#f4f6f9] text-[#212529] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[250px] bg-[#343a40] text-zinc-300 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
        {/* Brand Logo */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-700/50">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3">
             <span className="font-bold text-white text-lg">A</span>
          </div>
          <span className="text-xl font-light text-white">AdminLTE 4</span>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          <div className="mb-2">
            <a href="#" className="flex items-center px-3 py-2 rounded-md bg-[#007bff] text-white">
              <LayoutTemplate className="w-5 h-5 mr-3" />
              <span className="flex-1">Dashboard</span>
              <ChevronRight className="w-4 h-4 transition-transform rotate-90" />
            </a>
            <div className="pl-6 mt-1 space-y-1">
              <a href="#" className="flex items-center px-3 py-2 text-white bg-white/10 rounded-md">
                <CircleDot className="w-4 h-4 mr-3" />
                Dashboard v1
              </a>
              <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
                <Circle className="w-4 h-4 mr-3" />
                Dashboard v2
              </a>
              <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
                <Circle className="w-4 h-4 mr-3" />
                Dashboard v3
              </a>
            </div>
          </div>

          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <Settings className="w-5 h-5 mr-3" />
            Theme Generate
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <Grip className="w-5 h-5 mr-3" />
            Widgets
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <Layers className="w-5 h-5 mr-3" />
            Layout Options
            <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">6</span>
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <LayoutTemplate className="w-5 h-5 mr-3" />
            UI Elements
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <FileText className="w-5 h-5 mr-3" />
            Forms
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <Table className="w-5 h-5 mr-3" />
            Tables
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>

          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Examples</div>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <LogOut className="w-5 h-5 mr-3" />
            Auth
            <ChevronRight className="w-4 h-4 ml-auto" />
          </a>
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Documentations</div>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <Database className="w-5 h-5 mr-3 text-red-400" />
            Installation
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <LayoutTemplate className="w-5 h-5 mr-3 text-amber-400" />
            Layout
          </a>
          <a href="#" className="flex items-center px-3 py-2 hover:text-white hover:bg-white/5 rounded-md">
            <Settings className="w-5 h-5 mr-3 text-cyan-400" />
            Color Mode
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="text-zinc-500 hover:text-zinc-700 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <button className="text-zinc-500 hover:text-zinc-700 hidden md:block">
              <Menu className="w-5 h-5" />
            </button>
            <nav className="hidden sm:flex gap-4 text-sm font-medium text-zinc-600">
              <a href="#" className="hover:text-zinc-900">Home</a>
              <a href="#" className="hover:text-zinc-900">Contact</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-3 text-zinc-500">
            <button className="hover:text-zinc-700 p-1"><Search className="w-5 h-5" /></button>
            <div className="relative">
              <button className="hover:text-zinc-700 p-1"><MessageCircle className="w-5 h-5" /></button>
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full leading-none">3</span>
            </div>
            <div className="relative">
              <button className="hover:text-zinc-700 p-1"><Bell className="w-5 h-5" /></button>
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center rounded-full leading-none">15</span>
            </div>
            <button className="hover:text-zinc-700 p-1 hidden sm:block"><Maximize className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 ml-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden relative">
                <Image src="https://picsum.photos/seed/alex/100/100" alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
              </div>
              <span className="text-sm font-medium text-zinc-700 hidden sm:block">Alexander Pierce</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 w-full max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold text-zinc-800">Dashboard</h1>
            <div className="text-sm">
              <span className="text-[#007bff]">Home</span> <span className="text-zinc-500">/ Dashboard</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Blue Card */}
            <div className="bg-[#17a2b8] text-white rounded-lg flex flex-col overflow-hidden relative shadow-sm">
              <div className="p-5 relative z-10">
                <h3 className="text-4xl font-bold mb-1">150</h3>
                <p className="text-sm opacity-90">New Orders</p>
              </div>
              <ShoppingCart className="w-16 h-16 absolute right-4 top-4 text-black/15 z-0" />
              <div className="mt-auto bg-black/10 py-1.5 text-center text-sm font-medium hover:bg-black/15 transition-colors cursor-pointer z-10 flex items-center justify-center">
                More info <span className="text-xs ml-1 bg-white/20 rounded-full w-4 h-4 inline-flex items-center justify-center">→</span>
              </div>
            </div>

            {/* Green Card */}
            <div className="bg-[#28a745] text-white rounded-lg flex flex-col overflow-hidden relative shadow-sm">
              <div className="p-5 relative z-10">
                <h3 className="text-4xl font-bold mb-1">53<span className="text-xl">%</span></h3>
                <p className="text-sm opacity-90">Bounce Rate</p>
              </div>
              <BarChart2 className="w-16 h-16 absolute right-4 top-4 text-black/15 z-0" />
              <div className="mt-auto bg-black/10 py-1.5 text-center text-sm font-medium hover:bg-black/15 transition-colors cursor-pointer z-10 flex items-center justify-center">
                More info <span className="text-xs ml-1 bg-white/20 rounded-full w-4 h-4 inline-flex items-center justify-center">→</span>
              </div>
            </div>

            {/* Yellow Card */}
            <div className="bg-[#ffc107] text-[#1f2d3d] rounded-lg flex flex-col overflow-hidden relative shadow-sm">
              <div className="p-5 relative z-10">
                <h3 className="text-4xl font-bold mb-1">44</h3>
                <p className="text-sm opacity-90">User Registrations</p>
              </div>
              <UserPlus className="w-16 h-16 absolute right-4 top-4 text-black/15 z-0" />
              <div className="mt-auto bg-black/10 py-1.5 text-center text-sm font-medium hover:bg-black/15 transition-colors cursor-pointer z-10 flex items-center justify-center">
                More info <span className="text-xs ml-1 bg-black/20 text-[#1f2d3d] rounded-full w-4 h-4 inline-flex items-center justify-center">→</span>
              </div>
            </div>

            {/* Red Card */}
            <div className="bg-[#dc3545] text-white rounded-lg flex flex-col overflow-hidden relative shadow-sm">
              <div className="p-5 relative z-10">
                <h3 className="text-4xl font-bold mb-1">65</h3>
                <p className="text-sm opacity-90">Unique Visitors</p>
              </div>
              <PieChart className="w-16 h-16 absolute right-4 top-4 text-black/15 z-0" />
              <div className="mt-auto bg-black/10 py-1.5 text-center text-sm font-medium hover:bg-black/15 transition-colors cursor-pointer z-10 flex items-center justify-center">
                More info <span className="text-xs ml-1 bg-white/20 rounded-full w-4 h-4 inline-flex items-center justify-center">→</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Charts & Chat) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Sales Value Area Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
                <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-white rounded-t-lg">
                  <h3 className="text-lg font-medium text-zinc-800">Sales Value</h3>
                </div>
                <div className="p-4">
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#007bff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#007bff" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#28a745" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" tick={{fill: '#6c757d'}} />
                        <YAxis axisLine={false} tickLine={false} className="text-xs" tick={{fill: '#6c757d'}} />
                        <CartesianGrid vertical={false} stroke="#dee2e6" strokeDasharray="3 3" />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="#007bff" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" dataKey="visitors" stroke="#28a745" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Direct Chat Card */}
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
                <div className="px-4 py-3 border-b border-zinc-200 flex justify-between items-center bg-white rounded-t-lg">
                  <h3 className="text-base font-medium text-zinc-800">Direct Chat</h3>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <span className="bg-[#007bff] text-white text-xs px-2 py-0.5 rounded-full mr-2">3</span>
                    <button className="hover:text-zinc-600"><Minus className="w-4 h-4" /></button>
                    <button className="hover:text-zinc-600"><MessageCircle className="w-4 h-4" /></button>
                    <button className="hover:text-zinc-600"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4 h-[250px] overflow-y-auto space-y-4 bg-[#f8f9fa] flex flex-col">
                  
                  {/* Message 1 (Left) */}
                  <div className="flex flex-col mb-1">
                    <div className="flex items-end mb-1">
                      <span className="text-sm font-medium text-zinc-700">Alexander Pierce</span>
                      <span className="text-xs text-zinc-400 ml-2">23 Jan 2:00 pm</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative bg-zinc-200">
                        <Image src="https://picsum.photos/seed/alex/100/100" alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                      </div>
                      <div className="bg-zinc-200 text-zinc-800 px-4 py-2 rounded-lg rounded-tl-none text-sm max-w-[80%] shadow-sm relative">
                        Is this template really for free? That&apos;s unbelievable!
                      </div>
                    </div>
                  </div>

                  {/* Message 2 (Right) */}
                  <div className="flex flex-col items-end mb-1">
                    <div className="flex items-end justify-end mb-1">
                      <span className="text-xs text-zinc-400 mr-2">23 Jan 2:05 pm</span>
                      <span className="text-sm font-medium text-zinc-700">Sarah Bullock</span>
                    </div>
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative bg-zinc-200">
                        <Image src="https://picsum.photos/seed/sarah/100/100" alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                      </div>
                      <div className="bg-[#007bff] text-white px-4 py-2 rounded-lg rounded-tr-none text-sm max-w-[80%] shadow-sm">
                        You better believe it!
                      </div>
                    </div>
                  </div>

                  {/* Message 3 (Left) */}
                  <div className="flex flex-col mb-1">
                    <div className="flex items-end mb-1">
                      <span className="text-sm font-medium text-zinc-700">Alexander Pierce</span>
                      <span className="text-xs text-zinc-400 ml-2">23 Jan 5:37 pm</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative bg-zinc-200">
                        <Image src="https://picsum.photos/seed/alex/100/100" alt="Avatar" fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                      </div>
                      <div className="bg-zinc-200 text-zinc-800 px-4 py-2 rounded-lg rounded-tl-none text-sm max-w-[80%] shadow-sm relative">
                        Working with AdminLTE on a great new app! Wanna join?
                      </div>
                    </div>
                  </div>

                </div>
                <div className="p-3 border-t border-zinc-200 bg-white rounded-b-lg">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type Message ..." className="flex-1 text-sm border border-zinc-300 rounded focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] px-3 py-1.5 outline-none" />
                    <button className="bg-[#007bff] text-white px-4 py-1.5 text-sm rounded font-medium hover:bg-blue-600 transition-colors">Send</button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Map Card) */}
            <div className="lg:col-span-1">
              {/* Blue Map Card */}
              <div className="bg-[#007bff] text-white rounded-lg shadow-sm border border-[#0069d9] overflow-hidden flex flex-col h-full lg:h-[calc(100%-1.5rem)]">
                <div className="px-4 py-3 flex justify-between items-center border-b border-white/20">
                  <h3 className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Sales Value</h3>
                  <div className="flex items-center gap-2">
                    <button className="hover:text-white/80"><Minus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center items-center relative">
                   {/* Simplified World Vector visual representation using CSS patterns since we don't have SVG data */}
                   <div className="w-full text-center relative opacity-80 h-48 flex items-center justify-center overflow-hidden">
                      {/* Stylized placeholder for the map */}
                      <svg viewBox="0 0 1000 500" className="w-[120%] h-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-white/20">
                          <path d="M150 150 Q 200 100, 300 200 T 500 200 Q 600 300, 700 200 T 850 150 L 850 400 L 150 400 Z" />
                          <circle cx="280" cy="180" r="8" className="fill-white" />
                          <circle cx="580" cy="220" r="10" className="fill-white" />
                          <circle cx="780" cy="190" r="6" className="fill-white" />
                      </svg>
                   </div>
                </div>

                <div className="border-t border-white/20 bg-[#0069d9] p-4 flex justify-between gap-4">
                  <div className="flex-1 text-center border-r border-white/20 px-2 last:border-0">
                    <div className="h-8 mb-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData1}>
                          <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[11px] font-semibold text-white/90">Visitors</div>
                  </div>
                  <div className="flex-1 text-center border-r border-white/20 px-2 last:border-0">
                    <div className="h-8 mb-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData2}>
                          <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[11px] font-semibold text-white/90">Online</div>
                  </div>
                  <div className="flex-1 text-center px-2">
                    <div className="h-8 mb-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData3}>
                          <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[11px] font-semibold text-white/90">Sales</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
