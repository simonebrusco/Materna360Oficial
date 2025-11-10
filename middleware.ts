import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow Builder preview mode to pass through
  if (request.nextUrl.searchParams.has('builder.preview')) {
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
  matcher: ['/(tabs)/:path*'],
}
