import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

export default function middleware(req: NextRequest) {
  // Redirect /404 to /meu-dia
  if (req.nextUrl.pathname === '/404') {
    return NextResponse.redirect(new URL('/meu-dia', req.url));
  }

  return NextResponse.next();
}
