import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/

// --- Helpers de segurança ---
// Impede open redirect: só permite paths internos
function safeInternalRedirect(target: string | null | undefined, fallback = '/bem-vinda') {
  if (!target) return fallback
  const t = target.trim()
  if (!t) return fallback

  // Só aceitamos caminhos internos. Nada de http(s)://, //, ou \\
  if (!t.startsWith('/')) return fallback
  if (t.startsWith('//')) return fallback
  if (t.includes('\\')) return fallback
  return t
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

  // Callbacks de autenticação (confirm/reset, etc.) devem ser públicos
  if (pathname.startsWith('/auth')) return true

  // Rotas públicas de recuperação (P24)
  if (pathname.startsWith('/recuperar-senha')) return true

  return false
}

// Rotas protegidas (login obrigatório)
function isProtectedPath(pathname: string) {
  const p = pathname

  // P25 — onboarding pós-login
  if (p === '/bem-vinda' || p.startsWith('/bem-vinda/')) return true

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

  // Sempre criamos um response base para permitir set-cookie/refresh quando necessário
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

  // Se está logada e visita /login ou /signup, redireciona para destino (ou /bem-vinda)
  if (hasSession && (normalizedPath === '/login' || normalizedPath === '/signup')) {
    const rawNext = request.nextUrl.searchParams.get('redirectTo')
    const nextDest = safeInternalRedirect(rawNext, '/bem-vinda')
    return NextResponse.redirect(new URL(nextDest, request.url))
  }

  // "/" é público; se logada, joga para /bem-vinda (experiência pós-login)
  if (normalizedPath === '/' && hasSession) {
    return NextResponse.redirect(new URL('/bem-vinda', request.url))
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
      const rewriteUrl = new URL(normalizedPath, request.url)
      return NextResponse.rewrite(rewriteUrl)
    }
    return response
  }

  // Demais rotas: mantém comportamento existente de rewrite se vier com /(tabs)
  if (TABS_PREFIX_PATTERN.test(pathname)) {
    const rewriteUrl = new URL(normalizedPath, request.url)
    return NextResponse.rewrite(rewriteUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/|api/|.*\\..*|builder-embed|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
}
