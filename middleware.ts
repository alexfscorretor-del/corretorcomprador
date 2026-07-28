import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/server/supabase/middleware';

const PUBLIC_PREFIXES = ['/login', '/redefinir-senha'];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Static / next internals skipped via matcher

  try {
    const { user, supabaseResponse } = await updateSession(request);

    if (!user && !isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    if (user && (pathname === '/login' || pathname === '/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    // Env missing during build/preview — pass through
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
