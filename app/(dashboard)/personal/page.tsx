'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Save, Loader2, ShieldCheck, Mail, Fingerprint, Crown, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useProfile } from '@/lib/use-profile'

export default function PersonalProfilePage() {
  const supabase = createSupabaseClient()
  const { profile, loading: profileLoading } = useProfile()
  
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    kyc_status: ''
  })

  // Xác định quyền Admin dựa trên giá trị 'admin' trong cột role
  const isCurrentlyAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        role: profile.role || 'buyer', // Đồng bộ với cột 'role' trong DB của Thịnh
        kyc_status: profile.kyc_status || 'pending'
      })
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Phiên đăng nhập đã hết hạn!')

      // 1. Cập nhật Database (Dùng đúng cột 'role' như ảnh bạn gửi)
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          role: formData.role 
        })
        .eq('id', user.id)

      if (dbError) throw dbError

      // 2. Đồng bộ hóa Session Auth
      await supabase.auth.updateUser({
        data: { 
          full_name: formData.full_name, 
          role: formData.role 
        }
      })
      
      toast.success("Hệ thống đã cập nhật dữ liệu mới!")
    } catch (e: any) {
      console.error("Lỗi:", e)
      toast.error("Lỗi: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-emerald-500 font-mono tracking-[0.2em] animate-pulse">LOADING SYSTEM...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-10 flex flex-col items-center">
      {/* Header phong cách Hacker */}
      <div className="w-full max-w-2xl mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-white flex items-center justify-center md:justify-start gap-3">
          <Fingerprint className="w-10 h-10 text-emerald-500" />
          USER <span className="text-emerald-500">PROFILE</span>
        </h1>
        <p className="text-zinc-500 font-mono mt-2 uppercase text-xs tracking-widest">
          Secure identity management system v2.0
        </p>
      </div>

      <Card className="w-full max-w-2xl bg-zinc-900/50 border-zinc-800 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
        {/* Thanh trang trí trên cùng */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        
        <CardHeader className="pb-8">
          <CardTitle className="text-zinc-100 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
             Thông tin định danh
          </CardTitle>
          <CardDescription className="text-zinc-500 italic">
            Dữ liệu được mã hóa và bảo mật trên hệ thống Cloud.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              
              {/* Trường Họ tên */}
              <div className="group">
                <Label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest group-focus-within:text-emerald-500 transition-colors">
                  Họ và tên người dùng
                </Label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    name="full_name" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    className="bg-zinc-950 border-zinc-800 text-white pl-10 focus:border-emerald-500 h-11"
                    placeholder="Nhập tên của bạn..."
                  />
                </div>
              </div>

              {/* Trường Email (Read Only) */}
              <div className="opacity-70">
                <Label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Địa chỉ email hệ thống</Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-700" />
                  <Input 
                    value={formData.email} 
                    disabled 
                    className="bg-zinc-900 border-zinc-800 text-zinc-600 pl-10 h-11 cursor-not-allowed" 
                  />
                </div>
              </div>

              {/* Grid 2 cột */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lựa chọn Role */}
                <div className="group">
                  <Label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2 group-focus-within:text-emerald-500">
                    Quyền hạn tài khoản {isCurrentlyAdmin && <Crown className="w-3 h-3 text-amber-500" />}
                  </Label>
                  <div className="mt-1 relative">
                    <select 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange}
                      className="w-full h-11 bg-zinc-950 border border-zinc-800 rounded-md px-3 text-white outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                    >
                      {isCurrentlyAdmin && <option value="admin">QUẢN TRỊ VIÊN (ADMIN)</option>}
                      <option value="buyer">NGƯỜI MUA (BUYER)</option>
                      <option value="seller">NGƯỜI BÁN (SELLER)</option>
                      <option value="advisor">CỐ VẤN (ADVISOR)</option>
                    </select>
                  </div>
                </div>

                {/* Trạng thái xác thực */}
                <div>
                  <Label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Trạng thái bảo mật</Label>
                  <div className={`mt-1 flex items-center h-11 px-4 border border-zinc-800 rounded-md bg-zinc-950 font-bold text-[11px] tracking-tighter ${formData.kyc_status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {formData.kyc_status === 'verified' ? 'XÁC THỰC DANH TÍNH CẤP 1' : 'CHỜ XÁC THỰC'}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-7 rounded-none transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98]" 
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="animate-spin mr-2" /> ĐANG ĐỒNG BỘ...</>
              ) : (
                <><Save className="w-5 h-5 mr-2" /> CẬP NHẬT HỆ THỐNG</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer nhỏ */}
      <p className="mt-10 text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em]">
        Encrypted with 256-bit AES • Authorized Access Only
      </p>
    </div>
  )
}