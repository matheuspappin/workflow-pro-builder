import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Create an initial response
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
          // Update request cookies for the current request
          request.cookies.set({
            name,
            value,
            ...options,
          })
          
          // Re-create the response object to include updated request cookies
          // This ensures the next middleware/route handler sees the new cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Update the response cookies (Set-Cookie header)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Update request cookies for the current request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          
          // Re-create the response object to include updated request cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Update the response cookies (Set-Cookie header)
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

// #region agent log
    console.log(`[DEBUG] Proxy: ${request.nextUrl.pathname} - Cookie Role: ${request.cookies.get('user-role')?.value}`);
    fetch('http://127.0.0.1:7242/ingest/5e897388-3e47-4146-aa62-51afed14eb62',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327965'},body:JSON.stringify({sessionId:'327965',location:'proxy.ts:68',message:'Middleware request',data:{path:request.nextUrl.pathname,userRole:request.cookies.get('user-role')?.value},timestamp:Date.now()})}).catch(()=>{});
// #endregion
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
// #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e897388-3e47-4146-aa62-51afed14eb62',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327965'},body:JSON.stringify({sessionId:'327965',location:'middleware.ts:70',message:'User fetched',data:{userId:user?.id,userRoleMetadata:user?.user_metadata?.role},timestamp:Date.now()})}).catch(()=>{});
// #endregion
    
    // Se o user existe mas o cookie user-role não, tentamos recuperar do metadata
    let userRole = request.cookies.get('user-role')?.value
    if (user && !userRole) {
      userRole = user.user_metadata?.role
// #region agent log
      fetch('http://127.0.0.1:7242/ingest/5e897388-3e47-4146-aa62-51afed14eb62',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'327965'},body:JSON.stringify({sessionId:'327965',location:'proxy.ts:75',message:'Role recovered from metadata',data:{recoveredRole:userRole},timestamp:Date.now()})}).catch(()=>{});
// #endregion
      if (userRole) {
        // Opcional: setar o cookie na resposta se ele estiver faltando
        response.cookies.set('user-role', userRole, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
      }
    }

    const pathname = request.nextUrl.pathname

    // ─── Arquivos estáticos e rotas internas do Next.js ───────────────────────
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return response
    }

    // ─── Rotas de API públicas ─────────────────────────────────────────────────
    const PUBLIC_API_ROUTES = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/register',
      '/api/auth/verify-email',
      '/api/auth/verify-phone',
      '/api/auth/resend-confirmation',
      '/api/webhooks',
      '/api/cron',
    ]
    if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
      return response
    }

    // ─── Fire Protection bubble ───────────────────────────────────────────────
    // Rotas públicas dentro da bolha (landing, login, register)
    const isFireProtectionPublic =
      pathname === '/solutions/fire-protection' ||
      pathname === '/solutions/fire-protection/login' ||
      pathname === '/solutions/fire-protection/register'

    // Rotas protegidas dentro da bolha
    const isFireProtectionDashboard  = pathname.startsWith('/solutions/fire-protection/dashboard')
    const isFireProtectionEngineer   = pathname.startsWith('/solutions/fire-protection/engineer')
    const isFireProtectionTechnician = pathname.startsWith('/solutions/fire-protection/technician')
    const isFireProtectionClient     = pathname.startsWith('/solutions/fire-protection/client')
    const isFireProtectionProtected  =
      isFireProtectionDashboard ||
      isFireProtectionEngineer  ||
      isFireProtectionTechnician ||
      isFireProtectionClient

    // Toda a bolha fire-protection (public + protected)
    const isFireProtectionBubble =
      isFireProtectionPublic || isFireProtectionProtected

    // ─── Generic routes ────────────────────────────────────────────────────────
    const isAuthRoute =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/s/')

    const isPublicRoute =
      pathname === '/' ||
      pathname === '/white-label' ||
      pathname === '/shop' ||
      pathname === '/portal/login' ||
      pathname === '/portal/register' ||
      pathname === '/auth/set-password' ||
      pathname === '/subscription-expired' ||
      pathname.startsWith('/setup/invite/') ||
      (pathname.startsWith('/solutions') && !isFireProtectionProtected)

    const isDashboardRoute   = pathname.startsWith('/dashboard')
    const isEngineerRoute    = pathname.startsWith('/engineer')
    const isTeacherRoute     = pathname.startsWith('/teacher')
    const isTechnicianRoute  = pathname.startsWith('/technician')
    const isStudentRoute     = pathname.startsWith('/student')
    const isSellerRoute      = pathname.startsWith('/seller')
    const isFinanceRoute     = pathname.startsWith('/finance')
    const isAffiliateRoute   = pathname.startsWith('/portal/affiliate')

    // ─── Fire Protection bubble logic ─────────────────────────────────────────
    if (isFireProtectionProtected) {
      if (!user) {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      // Admin/empresa dashboard
      if (isFireProtectionDashboard) {
        if (userRole === 'engineer') {
          return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        }
        if (userRole === 'technician' || userRole === 'teacher') {
          return NextResponse.redirect(new URL('/solutions/fire-protection/technician', request.url))
        }
        if (userRole === 'student') {
          return NextResponse.redirect(new URL('/solutions/fire-protection/client', request.url))
        }
        if (userRole === 'seller') {
          return NextResponse.redirect(new URL('/seller', request.url))
        }
        if (userRole === 'finance') {
          return NextResponse.redirect(new URL('/finance', request.url))
        }
        // admin / super_admin → allow
      }

      if (isFireProtectionEngineer && userRole !== 'engineer' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isFireProtectionTechnician && userRole !== 'technician' && userRole !== 'teacher' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isFireProtectionClient && userRole !== 'student' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      return response
    }

    // Se está no login fire-protection mas já está autenticado
    if (pathname === '/solutions/fire-protection/login' && user && userRole) {
      if (userRole === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (userRole === 'engineer')    return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
      if (userRole === 'technician' || userRole === 'teacher') return NextResponse.redirect(new URL('/solutions/fire-protection/technician', request.url))
      if (userRole === 'student')     return NextResponse.redirect(new URL('/solutions/fire-protection/client', request.url))
      if (userRole === 'seller')      return NextResponse.redirect(new URL('/seller', request.url))
      if (userRole === 'finance')     return NextResponse.redirect(new URL('/finance', request.url))
      return NextResponse.redirect(new URL('/solutions/fire-protection/dashboard', request.url))
    }

    // ─── Generic route logic ───────────────────────────────────────────────────
    if (user && userRole) {
      if (isAuthRoute) {
        if (userRole === 'seller') return NextResponse.redirect(new URL('/seller', request.url))
        if (userRole === 'finance') return NextResponse.redirect(new URL('/finance', request.url))
        if (userRole === 'affiliate' || userRole === 'partner') return NextResponse.redirect(new URL('/portal/affiliate/dashboard', request.url))
        if (userRole === 'engineer') return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        if (userRole === 'technician' || userRole === 'teacher') return NextResponse.redirect(new URL('/solutions/fire-protection/technician', request.url))
        if (userRole === 'student') return NextResponse.redirect(new URL('/solutions/fire-protection/client', request.url))
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      if (isEngineerRoute && userRole !== 'engineer' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isTechnicianRoute && userRole !== 'technician' && userRole !== 'teacher' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isTeacherRoute && userRole !== 'teacher' && userRole !== 'super_admin') {
        if (userRole === 'engineer') return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isStudentRoute && userRole !== 'student' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isSellerRoute && userRole !== 'seller' && userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isFinanceRoute && userRole !== 'finance' && userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isDashboardRoute && userRole !== 'admin' && userRole !== 'professional' && userRole !== 'receptionist' && userRole !== 'super_admin') {
        if (userRole === 'seller') return NextResponse.redirect(new URL('/seller', request.url))
        if (userRole === 'finance') return NextResponse.redirect(new URL('/finance', request.url))
        if (userRole === 'affiliate' || userRole === 'partner') return NextResponse.redirect(new URL('/portal/affiliate/dashboard', request.url))
        if (userRole === 'engineer') return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        if (userRole === 'technician' || userRole === 'teacher') return NextResponse.redirect(new URL('/solutions/fire-protection/technician', request.url))
        if (userRole === 'student') return NextResponse.redirect(new URL('/solutions/fire-protection/client', request.url))
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isAffiliateRoute && userRole !== 'affiliate' && userRole !== 'partner' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } else if (!user && !isAuthRoute && !isPublicRoute) {
      if (isEngineerRoute || isTechnicianRoute) {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }
      if (isAffiliateRoute) {
        return NextResponse.redirect(new URL('/portal/affiliate/login', request.url))
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // --- White-Label / Custom Domain Logic ---
    // If we were to rewrite here, we would need to ensure 'response' is used or cookies are copied.
    // For now, returning 'response' (which might be the default or a modified one with cookies) is safe.

    return response
  }
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}