import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // In demo mode, just allow everything through
  const isDemoMode = true; // Set to false for production
  
  if (isDemoMode) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/employee/demo', '/dashboard', '/employee']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // Allow root path
  const isRootPath = request.nextUrl.pathname === '/'
  
  // If user is not logged in and trying to access protected route
  if (!session && !isPublicRoute && !isRootPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access login page, redirect to appropriate dashboard
  if (session && request.nextUrl.pathname === '/login') {
    try {
      const { data: employeeData } = await supabase
        .from('Employee Directory')
        .select('whalesync_postgres_id')
        .eq('official_email', session.user.email)
        .single()

      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = employeeData ? '/employee' : '/dashboard'
      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      console.error('Middleware error:', error)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

