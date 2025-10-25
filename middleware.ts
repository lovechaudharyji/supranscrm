import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware for API routes, static files, and auth-related paths
  if (req.nextUrl.pathname.startsWith('/api/') || 
      req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.startsWith('/favicon.ico') ||
      req.nextUrl.pathname === '/login') {
    return res;
  }
  
  // Check for demo mode cookie
  const demoRole = req.cookies.get('demo_user_role')?.value;
  
  if (demoRole) {
    // Allow demo users to access their respective pages
    if (demoRole === 'hr' && req.nextUrl.pathname.startsWith('/dashboard/attendance/hr')) {
      return res;
    }
    if (demoRole === 'employee' && req.nextUrl.pathname.startsWith('/employee')) {
      return res;
    }
    if (demoRole === 'admin' && req.nextUrl.pathname.startsWith('/dashboard')) {
      return res;
    }
  }

  // For real authentication, let the AuthContext handle it
  // Don't redirect to login here as it interferes with Supabase auth
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}