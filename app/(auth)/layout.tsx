import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Left Pane: Platform Branding & High-Density Stats */}
      <div className="hidden lg:flex w-5/12 bg-zinc-900/50 border-r border-border p-12 flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl tracking-tighter">DF</div>
            <Link href="/" className="text-2xl font-semibold tracking-tight">DealFlow</Link>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-light leading-tight">The global standard for <span className="text-primary">M&A execution.</span></h2>
            <p className="text-muted-foreground text-lg leading-relaxed">Securely manage your entire deal lifecycle from sourcing to integration on a single, encrypted infrastructure.</p>
          </div>
        </div>

        {/* Live Platform Stats */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 border border-border rounded-xl">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Active Mandates</p>
              <p className="text-2xl font-mono">$4.2B</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-border rounded-xl">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Verified Buyers</p>
              <p className="text-2xl font-mono">1,842</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary/80 font-mono">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            SYSTEMS NOMINAL - SOC2 TYPE II COMPLIANT
          </div>
        </div>
      </div>

      {/* Right Pane: Authentication Interface */}
      <div className="w-full lg:w-7/12 flex items-center justify-center relative p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="w-full max-w-[400px] z-10 space-y-8">
          {children}
        </div>
      </div>
    </div>
  )
}
