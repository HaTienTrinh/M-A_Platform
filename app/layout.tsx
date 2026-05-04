import './globals.css'
import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner"; // Thêm Toaster để hiển thị thông báo đẹp

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: 'DealFlow - M&A Marketplace',
  description: 'Professional M&A marketplace platform for business sellers and investors.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="vi" // Đổi sang tiếng Việt cho phù hợp dự án của Thịnh
      suppressHydrationWarning 
      className={cn(
        "min-h-screen bg-black font-sans antialiased", 
        inter.variable
      )}
    >
      <body 
        suppressHydrationWarning 
        className="min-h-screen bg-black text-white"
      >
        {/* Nội dung chính của ứng dụng */}
        {children}
        
        {/* Component thông báo toàn cục - cực kỳ quan trọng cho các nút Lưu/Cập nhật */}
        <Toaster 
          theme="dark" 
          position="top-right" 
          richColors 
          closeButton
        />
      </body>
    </html>
  )
}