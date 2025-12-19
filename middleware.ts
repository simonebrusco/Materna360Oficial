import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/

// 🔒 IMPORTANTÍSSIMO (P24)
// O middleware NÃO pode interceptar chamadas do Supabase Auth,
// senão você verá "Failed to fetch" / "CORS error" no signup/login.
function isSupabaseAuthPath(pathname: string) {
  // endpoints padrão do auth-helpers / Supabase no Next
  if (pathname.startsWith('/auth')) return true
  // (alguns setups expõem callbacks sob /api/auth também)
  if (pathname.startsWith('/api/auth')) return true
  return false
}

// Rotas públicas (sem login)
function isPublicPath(pathname: string) {
  if (pathname === '/') return true
  if (pathname === '/login') return true
  if (pathname === '/signup') return true
  if (pathname === '/planos') return true
  if (pathname === '/health') return true
  if (pathname.startsWith('/legal')) return true
  if (pathname.startsWith('/waitlist')) return true
  if (pathname.startsWith('/builder-embed')) return true
  return false
}

// Rotas protegidas (login obrigatório)
function isProtectedPath(pathname: string) {
  const p = pathname

  // Protege hubs e áreas sensíveis
  if (p === '/meu-dia' || p.startsWith('/meu-dia/')) return true
  if (p === '/eu360' || p.startsWith('/eu360/')) return true
  if (p === '/maternar' || p.startsWith('/maternar/')) return true
  if (p === '/cuidar' || p.startsWith('/cuidar/')) return true
  if (p === '/descobrir' || p.startsWith('/descobrir/')) return true

  // Protege admin e qa
  if (p === '/admin' || p.startsWith('/admin/')) return true
  if (p === '/qa' || p.startsWith('/qa/')) return true

  return false
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ✅ Bypass total: Supabase Auth endpoints
  // Sem isso: o middleware pode quebrar preflight/cookies e causar CORS/Failed to fetch
  if (isSupabaseAuthPath(pathname)) {
    return NextResponse.next()
  }

  // Allow Builder preview mode to pass through (both ?builder.preview=1 and /builder-embed paths)
  if (request.nextUrl.searchParams.has('builder.preview') || pathname.startsWith('/builder-embed')) {
    return NextResponse.next()
  }

  // Normaliza caso exista "/(tabs)" (cenário raro, mas preservamos a lógica do projeto)
  const normalizedPath = TABS_PREFIX_PATTERN.test(pathname)
    ? pathname.replace(TABS_PREFIX_PATTERN, '') || '/'
    : pathname

  const redirectToValue = `${normalizedPath}${request.nextUrl.search || ''}`

  // Fallback seguro: se env do Supabase não existir no ambiente, não bloqueia (para dev/build não quebrar)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const canAuth = Boolean(supabaseUrl && supabaseAnon)

  let hasSession = false

  // ⚠️ IMPORTANT: usar response (NextResponse.next) e passar no createMiddlewareClient
  const response = NextResponse.next()

  if (canAuth) {
    try {
      const supabase = createMiddlewareClient({ req: request, res: response })
      const {
        data: { session },
      } = await supabase.auth.getSession()

      hasSession = Boolean(session)
    } catch {
      hasSession = false
    }
  }

  // Se está logada e visita /login ou /signup, redireciona para destino (ou /maternar)
  if (hasSession && (normalizedPath === '/login' || normalizedPath === '/signup')) {
    const nextDest = request.nextUrl.searchParams.get('redirectTo') || '/maternar'
    return NextResponse.redirect(new URL(nextDest, request.url))
  }

  // "/" é público; se logada, joga para /maternar (experiência de app)
  if (normalizedPath === '/' && hasSession) {
    return NextResponse.redirect(new URL('/maternar', request.url))
  }

  // Se é rota protegida e NÃO tem sessão → manda para /login com redirectTo
  if (isProtectedPath(normalizedPath) && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', redirectToValue)
    return NextResponse.redirect(loginUrl)
  }

  // Rotas públicas seguem
  if (isPublicPath(normalizedPath)) {
    // Se o pathname original tinha /(tabs), mantém rewrite para normalizado
    if (TABS_PREFIX_PATTERN.test(pathname)) {
      const redirectUrl = new URL(normalizedPath, request.url)
      return NextResponse.rewrite(redirectUrl)
    }
    return response
  }

  // Demais rotas: mantém comportamento existente de rewrite se vier com /(tabs)
  if (TABS_PREFIX_PATTERN.test(pathname)) {
    const redirectUrl = new URL(normalizedPath, request.url)
    return NextResponse.rewrite(redirectUrl)
  }

  return response
}

export const config = {
  // Exclui _next, api, arquivos estáticos e builder-embed
  // + Exclui /auth e /api/auth para não quebrar Supabase Auth (CORS/Failed to fetch)
  matcher: ['/((?!_next|api|.*\\..*|builder-embed|auth).*)'],
}
