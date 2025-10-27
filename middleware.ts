import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const TABS_PREFIX_PATTERN = /^\/\(tabs\)(?=\/|$)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/(tabs)')) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = pathname.replace(TABS_PREFIX_PATTERN, '') || '/'

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/:path*'],
}
