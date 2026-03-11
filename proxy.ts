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

  const { data: { user } } = await supabase.auth.getUser()

  // Sincronizar cookie user-role com metadata do user (detecta mudanças de role)
  let userRole = request.cookies.get('user-role')?.value
  if (user) {
    const metadataRole = user.user_metadata?.role as string | undefined
    if (metadataRole && metadataRole !== userRole) {
      userRole = metadataRole
      response.cookies.set('user-role', metadataRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  const url = request.nextUrl.clone()
  const pathname = url.pathname
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0].toLowerCase()

  // ─── Subdomínios e Domínios Customizados (AKAAI CORE) ─────────────────────
  // DanceFlow, Fire Protection, AgroFlow - mapeamento para rotas /solutions/*
  const subdomainMap: Array<{ pattern: RegExp; base: string }> = [
    { pattern: /^(danceflow|studio-danca|danca)\./i, base: '/solutions/estudio-de-danca' },
    { pattern: /^(fire-protection|fireprotection|fire)\./i, base: '/solutions/fire-protection' },
    { pattern: /^(agroflow|agroflowai|agro)\./i, base: '/solutions/agroflowai' },
  ]
  for (const { pattern, base } of subdomainMap) {
    if (pattern.test(hostname) && !pathname.startsWith(base)) {
      url.pathname = base + (pathname === '/' ? '' : pathname)
      return Response.redirect(url)
    }
  }

  // ─── Arquivos estáticos e rotas internas do Next.js ───────────────────────
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|eot)$/i.test(pathname)
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

    // ─── Modo Manutenção ──────────────────────────────────────────────────────
    // APÓS rotas públicas (auth/cron/webhooks devem funcionar em manutenção)
    if (process.env.MAINTENANCE_MODE === 'true') {
      const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
      const isMaintenancePage = pathname === '/maintenance'
      if (!isAdminPath && !isMaintenancePage) {
        // APIs regulares recebem 503 JSON; páginas recebem redirect
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Sistema em manutenção. Tente novamente em alguns minutos.' },
            { status: 503 }
          )
        }
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }

    // ─── API admin: 401 se não autenticado ────────────────────────────────────
    if (pathname.startsWith('/api/admin') && !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // ─── Fire Protection bubble ───────────────────────────────────────────────
    const isFireProtectionDashboard  = pathname.startsWith('/solutions/fire-protection/dashboard')
    const isFireProtectionEngineer   = pathname.startsWith('/solutions/fire-protection/engineer')
    const isFireProtectionTechnician = pathname.startsWith('/solutions/fire-protection/technician')
    const isFireProtectionClient     = pathname.startsWith('/solutions/fire-protection/client')
    const isFireProtectionProtected  =
      isFireProtectionDashboard ||
      isFireProtectionEngineer  ||
      isFireProtectionTechnician ||
      isFireProtectionClient

    // ─── DanceFlow bubble ─────────────────────────────────────────────────────
    const isDanceFlowDashboard  = pathname.startsWith('/solutions/estudio-de-danca/dashboard')
    const isDanceFlowTeacher    = pathname.startsWith('/solutions/estudio-de-danca/teacher')
    const isDanceFlowStudent    = pathname.startsWith('/solutions/estudio-de-danca/student')
    const isDanceFlowProtected  = isDanceFlowDashboard || isDanceFlowTeacher || isDanceFlowStudent

    // ─── AgroFlowAI bubble ────────────────────────────────────────────────────
    const isAgroFlowDashboard = pathname.startsWith('/solutions/agroflowai/dashboard')
    const isAgroFlowClient    = pathname.startsWith('/solutions/agroflowai/client')
    const isAgroFlowProtected = isAgroFlowDashboard || isAgroFlowClient

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
      pathname === '/home' ||
      pathname === '/white-label' ||
      pathname === '/shop' ||
      pathname.startsWith('/shop/') ||
      pathname === '/portal/login' ||
      pathname === '/portal/register' ||
      pathname === '/auth/set-password' ||
      pathname === '/subscription-expired' ||
      pathname.startsWith('/setup/invite/') ||
      (pathname.startsWith('/solutions') && !isFireProtectionProtected && !isDanceFlowProtected && !isAgroFlowProtected)

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

    // ─── DanceFlow bubble logic ───────────────────────────────────────────────
    if (isDanceFlowProtected) {
      if (!user) {
        return NextResponse.redirect(new URL('/solutions/estudio-de-danca/login', request.url))
      }
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      if (isDanceFlowDashboard) {
        if (userRole === 'student') {
          return NextResponse.redirect(new URL('/solutions/estudio-de-danca/student', request.url))
        }
        if (userRole === 'teacher') {
          return NextResponse.redirect(new URL('/solutions/estudio-de-danca/teacher', request.url))
        }
      }
      if (isDanceFlowTeacher && userRole !== 'teacher' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/estudio-de-danca/login', request.url))
      }
      if (isDanceFlowStudent && userRole !== 'student' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/estudio-de-danca/login', request.url))
      }
      return response
    }

    if (pathname === '/solutions/estudio-de-danca/login' && user && userRole) {
      if (userRole === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (userRole === 'student')     return NextResponse.redirect(new URL('/solutions/estudio-de-danca/student', request.url))
      if (userRole === 'teacher')     return NextResponse.redirect(new URL('/solutions/estudio-de-danca/teacher', request.url))
      return NextResponse.redirect(new URL('/solutions/estudio-de-danca/dashboard', request.url))
    }

    // ─── AgroFlowAI bubble logic ──────────────────────────────────────────────
    if (isAgroFlowProtected) {
      if (!user) {
        return NextResponse.redirect(new URL('/solutions/agroflowai/login', request.url))
      }
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      if (isAgroFlowDashboard) {
        if (userRole === 'student' || userRole === 'client') {
          return NextResponse.redirect(new URL('/solutions/agroflowai/client', request.url))
        }
      }
      if (isAgroFlowClient && userRole !== 'student' && userRole !== 'client' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/agroflowai/login', request.url))
      }
      return response
    }

    if (pathname === '/solutions/agroflowai/login' && user && userRole) {
      if (userRole === 'super_admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (userRole === 'student' || userRole === 'client') return NextResponse.redirect(new URL('/solutions/agroflowai/client', request.url))
      return NextResponse.redirect(new URL('/solutions/agroflowai/dashboard', request.url))
    }

    // ─── Generic route logic ───────────────────────────────────────────────────
    // Para rotas protegidas de student/technician/engineer sem role no cookie ainda
    // (primeiro request após login), permitir passagem — o cookie será sincronizado acima
    const effectiveRole = userRole || user?.user_metadata?.role

    if (user && effectiveRole) {
      if (isAuthRoute) {
        if (effectiveRole === 'seller') return NextResponse.redirect(new URL('/seller', request.url))
        if (effectiveRole === 'finance') return NextResponse.redirect(new URL('/finance', request.url))
        if (effectiveRole === 'affiliate' || effectiveRole === 'partner') return NextResponse.redirect(new URL('/portal/affiliate/dashboard', request.url))
        if (effectiveRole === 'engineer') return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        if (effectiveRole === 'technician') return NextResponse.redirect(new URL('/solutions/fire-protection/technician', request.url))
        if (effectiveRole === 'teacher') return NextResponse.redirect(new URL('/solutions/estudio-de-danca/teacher', request.url))
        // student: redirecionar para o portal correto baseado no niche do user_metadata
        if (effectiveRole === 'student') {
          const niche = user?.user_metadata?.niche || user?.user_metadata?.vertical || ''
          if (niche === 'fire_protection') return NextResponse.redirect(new URL('/solutions/fire-protection/client', request.url))
          if (niche === 'agroflowai' || niche === 'agro') return NextResponse.redirect(new URL('/solutions/agroflowai/client', request.url))
          // Default: portal genérico de aluno (dance/gym/outros)
          return NextResponse.redirect(new URL('/student', request.url))
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      if (isEngineerRoute && effectiveRole !== 'engineer' && effectiveRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isTechnicianRoute && effectiveRole !== 'technician' && effectiveRole !== 'teacher' && effectiveRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/solutions/fire-protection/login', request.url))
      }

      if (isTeacherRoute && effectiveRole !== 'teacher' && effectiveRole !== 'super_admin') {
        if (effectiveRole === 'engineer') return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        return NextResponse.redirect(new URL('/solutions/estudio-de-danca/login', request.url))
      }

      if (isStudentRoute && effectiveRole !== 'student' && effectiveRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isSellerRoute && effectiveRole !== 'seller' && effectiveRole !== 'admin' && effectiveRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isFinanceRoute && effectiveRole !== 'finance' && effectiveRole !== 'admin' && effectiveRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isDashboardRoute && effectiveRole !== 'admin' && effectiveRole !== 'teacher' && effectiveRole !== 'finance' && effectiveRole !== 'super_admin') {
        if (effectiveRole === 'seller') return NextResponse.redirect(new URL('/seller', request.url))
        if (effectiveRole === 'finance') return NextResponse.redirect(new URL('/finance', request.url))
        if (effectiveRole === 'affiliate' || effectiveRole === 'partner') return NextResponse.redirect(new URL('/portal/affiliate/dashboard', request.url))
        if (effectiveRole === 'engineer') return NextResponse.redirect(new URL('/solutions/fire-protection/engineer', request.url))
        if (effectiveRole === 'technician') return NextResponse.redirect(new URL('/solutions/fire-protection/technician', request.url))
        if (effectiveRole === 'teacher') return NextResponse.redirect(new URL('/solutions/estudio-de-danca/teacher', request.url))
        if (effectiveRole === 'student') return NextResponse.redirect(new URL('/student', request.url))
        return NextResponse.redirect(new URL('/login', request.url))
      }

      if (isAffiliateRoute && effectiveRole !== 'affiliate' && effectiveRole !== 'partner' && effectiveRole !== 'super_admin') {
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
    return response
  }

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}