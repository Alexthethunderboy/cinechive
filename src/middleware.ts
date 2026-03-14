import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Pages that are accessible without an account
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isPublicPage =
    isAuthPage ||
    pathname === '/' ||
    pathname.startsWith('/discover') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/classifications') ||
    pathname.startsWith('/auth'); // OAuth callback

  // Redirect logged-in users away from auth pages
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users away from all non-public pages
  if (!user && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Mobile Agent Detection
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /mobile|iphone|ipad|android/i.test(userAgent);
  response.headers.set('x-is-mobile-agent', isMobile ? 'true' : 'false');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/ static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
