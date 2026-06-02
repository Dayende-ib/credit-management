import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyBankJWT } from '@/lib/auth/jwt'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Bank routes protection
  if (pathname.startsWith('/bank')) {
    if (pathname === '/bank/login') {
      return NextResponse.next()
    }

    const bankToken = request.cookies.get('bank_session')?.value
    if (!bankToken) {
      return NextResponse.redirect(new URL('/bank/login', request.url))
    }

    const session = await verifyBankJWT(bankToken)
    if (!session) {
      const response = NextResponse.redirect(new URL('/bank/login', request.url))
      response.cookies.delete('bank_session')
      return response
    }

    // Admin-only route
    if (pathname.startsWith('/bank/users') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/bank/dashboard', request.url))
    }

    return NextResponse.next()
  }

  // Client routes protection
  if (pathname.startsWith('/client')) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/client/:path*', '/bank/:path*'],
}
