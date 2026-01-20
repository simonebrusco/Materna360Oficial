// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/
const SEEN_KEY = 'm360_seen_welcome_v1'

/* =========================
   Helpers de segurança
========================= */

function safeInternalRedirect(target: string | null | undefined, fallback = '/meu-dia') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
}

function isPublicPath(pathname: string) {
  if (pathname === '/') return true
  if (pathname === '/login') return true
  if (pathname === '/signup') return true
  if (pathname === '/planos') return true
  if (pathname === '/health') return true
  if (pathname.startsWith('/legal')) return true
  if (pathname.startsWith('/waitlist')) return true
  if (pathname.startsWith('/builder-embed')) return true
  if (pathname.startsWith('/auth')) return true
  if (pathname.startsWith('/recuperar-senha')) return true
  return false
}

function isProtectedPath(pathname: string) {
  if (pathname === '/bem-vinda' || pathname.startsWith('/bem-vinda/')) return true
  if (pathname === '/meu-dia' || pathname.startsWith('/meu-dia/')) return true
  if (pathname === '/eu360' || pathname.startsWith('/eu360/')) return true
  if (pathname === '/maternar' || pathname.startsWith('/maternar/')) return true
  if (pathname === '/cuidar' || pathname.startsWith('/cuidar/')) return true
  if (pathname === '/descobrir' || pathname.startsWith('/descobrir/')) return true
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true
  if (pathname === '/qa' || pathname.startsWith('/qa/')) return true
  return false
}

/* =========================
   Middleware
========================= */

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Builder / preview sempre passa
  if (request.nextUrl.searchParams.has('builder.preview') || pathname.startsWith('/builder-embed')) {
    return NextResponse.next()
  }

  // Normalização /(tabs)
  const normalizedPath = TABS_PREFIX_PATTERN.test(pathname)
    ? pathname.replace(TABS_PREFIX_PATTERN, '') || '/'
    : pathname

  const redirectToValue = `${normalizedPath}${request.nextUrl.search || ''}`

  // Response base (precisa ser mutável para cookies do SSR)
  let response = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const canAuth = Boolean(supabaseUrl && supabaseAnon)

  let hasSession = false
  let hasSeenWelcome = false
  let userEmail: string | null = null

  // Cria client SSR (Edge-safe) somente se tiver env
  const supabase = canAuth
    ? createServerClient(supabaseUrl!, supabaseAnon!, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options, maxAge: 0 })
          },
        },
      })
    : null

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      hasSession = Boolean(session)
      if (hasSession) {
        userEmail = session?.user?.email ?? null
        hasSeenWelcome = request.cookies.get(SEEN_KEY)?.value === '1'
      }
    } catch {
      hasSession = false
      hasSeenWelcome = false
      userEmail = null
    }
  }

  /* =========================
     Regras principais
  ========================= */

  // Logada tentando acessar login/signup -> aplica entrada
  if (hasSession && (normalizedPath === '/login' || normalizedPath === '/signup')) {
    if (!hasSeenWelcome) {
      return NextResponse.redirect(new URL('/bem-vinda', request.url))
    }

    const rawNext = request.nextUrl.searchParams.get('redirectTo')
    const nextDest = safeInternalRedirect(rawNext, '/meu-dia')
    return NextResponse.redirect(new URL(nextDest, request.url))
  }

  // "/" é público — mas se logada, aplica regra de entrada
  if (normalizedPath === '/' && hasSession) {
    if (!hasSeenWelcome) {
      return NextResponse.redirect(new URL('/bem-vinda', request.url))
    }
    return NextResponse.redirect(new URL('/meu-dia', request.url))
  }

  // Rota protegida sem sessão -> login
  if (isProtectedPath(normalizedPath) && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', redirectToValue)
    return NextResponse.redirect(loginUrl)
  }

  // 🔒 Gate adicional: /admin exige ser admin (além de estar logada)
  if (hasSession && (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/'))) {
    if (!userEmail || !supabase) {
      return NextResponse.redirect(new URL('/meu-dia', request.url))
    }

    try {
      const { data: adminRow, error: adminErr } = await supabase
        .from('adm_admins')
        .select('email')
        .eq('email', userEmail)
        .maybeSingle()

      if (adminErr || !adminRow) {
        return NextResponse.redirect(new URL('/meu-dia', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/meu-dia', request.url))
    }
  }

  // Rotas públicas seguem
  if (isPublicPath(normalizedPath)) {
    if (TABS_PREFIX_PATTERN.test(pathname)) {
      return NextResponse.rewrite(new URL(normalizedPath, request.url))
    }
    return response
  }

  // Rewrite padrão /(tabs)
  if (TABS_PREFIX_PATTERN.test(pathname)) {
    return NextResponse.rewrite(new URL(normalizedPath, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/|api/|.*\\..*|builder-embed|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
}
