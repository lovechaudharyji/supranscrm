import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Check for demo mode first
  const demoRole = req.cookies.get('demo_user_role')?.value || 
                   req.headers.get('x-demo-role');
  
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
    if (req.nextUrl.pathname === '/login') {
      return res;
    }
  }

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not authenticated, allow access to login page
  if (!user && req.nextUrl.pathname === '/login') {
    return res
  }

  // If user is not authenticated, redirect to login
  if (!user && req.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is authenticated, check their role and redirect accordingly
  if (user) {
    try {
      // Check if user is HR
      const { data: employeeData } = await supabase
        .from("Employee Directory")
        .select("job_title, department")
        .eq("official_email", user.email)
        .single();

      const isHR = employeeData && (
        employeeData.job_title?.toLowerCase().includes('hr') || 
        employeeData.department?.toLowerCase().includes('hr')
      );

      const isEmployee = employeeData && !isHR;

      // HR users can only access HR attendance pages
      if (isHR) {
        if (req.nextUrl.pathname.startsWith('/dashboard/attendance/hr') || 
            req.nextUrl.pathname === '/login') {
          return res;
        } else {
          // Redirect HR users to their attendance page
          return NextResponse.redirect(new URL('/dashboard/attendance/hr', req.url));
        }
      }

      // Regular employees can only access employee pages
      if (isEmployee) {
        if (req.nextUrl.pathname.startsWith('/employee') || 
            req.nextUrl.pathname === '/login') {
          return res;
        } else {
          // Redirect employees to their dashboard
          return NextResponse.redirect(new URL('/employee', req.url));
        }
      }

      // Admins can access all dashboard pages
      if (!employeeData) {
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname === '/login') {
          return res;
        } else {
          // Redirect admins to dashboard
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

    } catch (error) {
      console.error('Middleware error:', error);
      // If there's an error checking user role, redirect to login
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

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