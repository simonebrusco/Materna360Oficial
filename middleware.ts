import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/(tabs)')) {
    return NextResponse.next()
  }

  const normalizedPath = pathname.replace(TABS_PREFIX_PATTERN, '') || '/'
  const redirectUrl = new URL(normalizedPath, request.url)

  return NextResponse.rewrite(redirectUrl)
}

export const config = {
  matcher: ['/:path*'],
}
