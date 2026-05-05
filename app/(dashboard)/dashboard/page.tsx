'use client'

import { useProfile } from '@/lib/use-profile'
import { SellerDashboard } from '@/components/dashboard/SellerDashboard'
import { BuyerDashboard } from '@/components/dashboard/BuyerDashboard'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { Loader2, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion' // Thêm framer-motion nếu bạn có dùng

export default function DashboardPage() {
  const { profile, loading } = useProfile()
  
  // 1. Trạng thái Loading phong cách Cyber
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-500 font-mono text-xs tracking-[0.3em] animate-pulse">
          VERIFYING ACCESS...
        </p>
      </div>
    )
  }
  
  // 2. Xử lý khi không có profile hoặc session lỗi
  if (!profile) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Không tìm thấy dữ liệu</h2>
        <p className="text-zinc-400 mt-2">Vui lòng thử đăng nhập lại để tiếp tục.</p>
      </div>
    )
  }
  
  // 3. Điều hướng Dashboard dựa trên Role (Đã khớp với cột 'role' trong DB của Thịnh)
  // Dùng Switch Case cho sạch code hơn
  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />
      case 'seller':
        return <SellerDashboard />
      case 'buyer':
      case 'advisor': // Advisor dùng chung view với Buyer như ý bạn muốn
        return <BuyerDashboard />
      default:
        // Trường hợp role lạ hoặc chưa set role
        return <BuyerDashboard /> 
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={profile.role}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {renderDashboard()}
      </motion.div>
    </AnimatePresence>
  )
}