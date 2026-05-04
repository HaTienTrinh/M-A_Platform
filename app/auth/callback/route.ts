import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          sameSite: 'none',
          secure: true
        },
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options, sameSite: 'none', secure: true })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options, sameSite: 'none', secure: true })
          },
        },
      }
    )
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && user) {
      // Sync user data to public.users table
      // This handles the "Auto-populate" and "Merge" logic requested
      const metadata = user.user_metadata
      const fullName = metadata.full_name || metadata.name || 
                       `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim()
      const profileUrl = metadata.avatar_url || metadata.picture
      const linkedinId = metadata.sub

      await supabase.from('users').upsert({
        id: user.id,
        email: user.email!,
        full_name: fullName || 'User',
        role: metadata.role || 'buyer', // FIX: Include role in upsert
        profile_url: profileUrl,
        linkedin_id: linkedinId
      }, { onConflict: 'id' })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=InvalidLink`)
}
