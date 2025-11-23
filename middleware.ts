import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Redirect root to /meu-dia
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/meu-dia', request.url))
  }

  // Allow Builder preview mode to pass through (both ?builder.preview=1 and /builder-embed paths)
  if (request.nextUrl.searchParams.has('builder.preview') || pathname.startsWith('/builder-embed')) {
    return NextResponse.next()
  }

  if (!TABS_PREFIX_PATTERN.test(pathname)) {
    return NextResponse.next()
  }

  const normalizedPath = pathname.replace(TABS_PREFIX_PATTERN, '') || '/'
  const redirectUrl = new URL(normalizedPath, request.url)

  return NextResponse.rewrite(redirectUrl)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*|builder-embed).*)'],
}
