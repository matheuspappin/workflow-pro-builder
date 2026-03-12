import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  VERTICALIZATIONS,
  getVerticalizationByHostname,
  getVerticalizationByPath,
  getRoleRedirect,
  roleCanAccessPath,
} from '@/config/verticalizations'

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

  // SEGURANÇA: user-role cookie é SEMPRE sobrescrito pelo metadata do JWT.
  // Nunca confiar no valor do cookie para autorização — apenas para cache de redirect.
  // Qualquer decisão de acesso a dados usa checkStudioAccess() ou o JWT diretamente.
  let userRole: string | undefined
  if (user) {
    const metadataRole = (user.user_metadata?.role || user.app_metadata?.role) as string | undefined
    const cookieRole = request.cookies.get('user-role')?.value
    userRole = metadataRole
    if (metadataRole && metadataRole !== cookieRole) {
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
  // Redireciona subdomínios para /solutions/<basePath> usando config centralizada
  const vByHost = getVerticalizationByHostname(hostname)
  if (vByHost) {
    const base = `/solutions/${vByHost.basePath}`
    if (!pathname.startsWith(base)) {
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

    // ─── Verticalizações: detecta nicho e sub-rota protegida ──────────────────
    const activeVertical = getVerticalizationByPath(pathname)
    const isVerticalizationProtected = activeVertical
      ? activeVertical.protectedPaths.some((p) =>
          pathname.startsWith(`/solutions/${activeVertical.basePath}/${p}`)
        )
      : false

    // Retrocompat: variáveis booleanas usadas abaixo nas regras genéricas
    const isFireProtectionProtected = !!activeVertical && activeVertical.key === 'fire-protection' && isVerticalizationProtected
    const isDanceFlowProtected = !!activeVertical && activeVertical.key === 'estudio-de-danca' && isVerticalizationProtected
    const isAgroFlowProtected = !!activeVertical && activeVertical.key === 'agroflowai' && isVerticalizationProtected

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
      pathname === '/portal/affiliate' ||
      pathname === '/portal/affiliate/login' ||
      pathname === '/portal/affiliate/register' ||
      pathname === '/auth/set-password' ||
      pathname === '/subscription-expired' ||
      pathname.startsWith('/setup/invite/') ||
      (pathname.startsWith('/solutions') && !isVerticalizationProtected)

    const isDashboardRoute   = pathname.startsWith('/dashboard')
    const isEngineerRoute    = pathname.startsWith('/engineer')
    const isTeacherRoute     = pathname.startsWith('/teacher')
    const isTechnicianRoute  = pathname.startsWith('/technician')
    const isStudentRoute     = pathname.startsWith('/student')
    const isSellerRoute      = pathname.startsWith('/seller')
    const isFinanceRoute     = pathname.startsWith('/finance')
    const isAffiliateRoute   = pathname.startsWith('/portal/affiliate')

    // ─── Verticalizações: lógica genérica (lê config/verticalizations.ts) ─────
    if (isVerticalizationProtected && activeVertical) {
      if (!user) {
        return NextResponse.redirect(new URL(activeVertical.loginPath, request.url))
      }
      const role = userRole || ''
      // Dashboard: redirecionar para sub-rota correta por role
      if (pathname === `/solutions/${activeVertical.basePath}/dashboard`) {
        const redirect = activeVertical.roleRedirects[role]
        if (redirect) return NextResponse.redirect(new URL(redirect, request.url))
        // admin / sem redirect específico → mantém no dashboard
        return response
      }
      // Sub-rotas com restrição de role
      for (const [subPath, allowedRoles] of Object.entries(activeVertical.pathRoles)) {
        if (pathname.startsWith(`/solutions/${activeVertical.basePath}/${subPath}`)) {
          if (!allowedRoles.includes(role)) {
            return NextResponse.redirect(new URL(activeVertical.loginPath, request.url))
          }
          break
        }
      }
      return response
    }

    // Se está na página de login de um nicho mas já está autenticado
    if (activeVertical && pathname === activeVertical.loginPath && user && userRole) {
      const redirect = getRoleRedirect(activeVertical, userRole)
      return NextResponse.redirect(new URL(redirect, request.url))
    }

    // ─── Generic route logic ───────────────────────────────────────────────────
    // Para rotas protegidas de student/technician/engineer sem role no cookie ainda
    // (primeiro request após login), permitir passagem — o cookie será sincronizado acima
    // effectiveRole: sempre deriva do JWT/metadata, nunca do cookie cru
    const effectiveRole = (user?.user_metadata?.role || user?.app_metadata?.role) as string | undefined

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

      // Afiliado logado em /portal/affiliate/login → dashboard
      if ((pathname === '/portal/affiliate/login' || pathname === '/portal/affiliate/register') && (effectiveRole === 'affiliate' || effectiveRole === 'partner')) {
        return NextResponse.redirect(new URL('/portal/affiliate/dashboard', request.url))
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