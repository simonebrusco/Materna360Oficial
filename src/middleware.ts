import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rewrite /(tabs)/path to /path
  if (pathname.startsWith('/(tabs)/')) {
    const newPathname = pathname.replace('/(tabs)/', '/');
    return NextResponse.rewrite(new URL(newPathname, req.url));
  }

  // Redirect /404 to /meu-dia
  if (pathname === '/404') {
    return NextResponse.redirect(new URL('/meu-dia', req.url));
  }

  return NextResponse.next();
}
