import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  // Refresh the session if needed
  await supabase.auth.getUser()

  // --- Domain Logic ---
  const hostname = request.headers.get('host')
  const appDomains = ['app.workflowpro.com', 'localhost:3000', 'workflowpro.vercel.app']
  
  if (appDomains.includes(hostname || '')) {
    return response
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
