import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase/config';
import { supabaseFetch } from '@/lib/supabase/fetch';

function withDeviceHeader(response: NextResponse, request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /mobile|iphone|ipad|android/i.test(userAgent);
  response.headers.set('x-is-mobile-agent', isMobile ? 'true' : 'false');
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isLocalArchivePage =
    pathname === '/profile' ||
    pathname.startsWith('/profile/settings') ||
    pathname.startsWith('/vault') ||
    pathname.startsWith('/collections') ||
    pathname.startsWith('/notifications');
  const isLocalModeInfoPage = pathname.startsWith('/local-mode');
  const isPublicPage =
    isAuthPage ||
    isLocalArchivePage ||
    isLocalModeInfoPage ||
    pathname === '/' ||
    pathname.startsWith('/discover') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/classifications') ||
    pathname.startsWith('/auth');

  // Public discovery must never wait for an optional account backend.
  // Server actions and protected pages still enforce authorization themselves.
  if (isPublicPage) {
    return withDeviceHeader(NextResponse.next({
      request: { headers: request.headers },
    }), request);
  }

  if (!isSupabaseConfigured()) {
    if (pathname.startsWith('/community') || pathname.startsWith('/people') || pathname.startsWith('/share/collection')) {
      return NextResponse.redirect(new URL('/local-mode', request.url));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'service-unavailable');
    loginUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      global: { fetch: supabaseFetch },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'service-unavailable');
    loginUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect unauthenticated users away from all non-public pages
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    const returnTo = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('returnTo', returnTo);
    return NextResponse.redirect(loginUrl);
  }

  return withDeviceHeader(response, request);
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
