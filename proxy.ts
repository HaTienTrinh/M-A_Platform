import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl

  // Fast path: bypass all middleware logic for internal Next.js requests
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__nextjs') ||
    pathname.includes('favicon.ico')
  ) {
    return supabaseResponse
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // If no config is present, allow the request to pass through
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/__nextjs') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/verify-otp') ||
    pathname === '/deals' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/demo')

  const isAdminRoute = pathname.startsWith('/admin')
  const isSellerRoute =
    pathname.startsWith('/deals/create') ||
    pathname.startsWith('/company/create')

  // Helper function to redirect while preserving cookies set by Supabase SSR
  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  if (!user && !isAuthRoute && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return redirectWithCookies(loginUrl)
  }

  if (user && isAuthRoute) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/dashboard'
    return redirectWithCookies(homeUrl)
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return redirectWithCookies(dashboardUrl)
    }
  }

  if (user && isSellerRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['seller', 'admin'].includes(profile.role)) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return redirectWithCookies(dashboardUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
