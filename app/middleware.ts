import { NextResponse } from 'next/server'

// Match all non-static, non-API paths
export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}

export default function middleware() {
  return NextResponse.next()
}
