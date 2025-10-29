import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

export default function middleware(req: NextRequest) {
  let url = req.nextUrl.clone();
  
  // Strip /(tabs) prefix from URL
  if (url.pathname.startsWith('/(tabs)/')) {
    url.pathname = url.pathname.replace('/(tabs)/', '/');
  }
  
  // Redirect /404 to /meu-dia
  if (url.pathname === '/404') {
    url.pathname = '/meu-dia';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}
