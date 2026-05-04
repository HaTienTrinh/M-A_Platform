import './globals.css'
import type { Metadata } from 'next'
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
