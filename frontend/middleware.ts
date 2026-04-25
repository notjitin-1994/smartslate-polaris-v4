import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { logger } from '@/lib/logging';

// Public routes do not require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/favicon.ico',
  '/demo-loading',
  '/pricing',
  '/my-starmaps',
  '/subscription',
  '/share', // Public share pages - no auth required
  '/landing', // Landing page - public access
  '/features', // Features and documentation page - public access
  '/best-practices', // Best practices page - public access
  '/recommended-workflow', // Recommended workflow page - public access
  '/api/auth/check-email', // Email existence check for signup - public access
  '/api/auth/signup', // Signup API endpoint - public access
  '/api/auth/reset-request', // Password reset request - public access
  '/api/blueprints/share', // Public blueprint sharing API - no auth required
  '/api/feedback/send-email', // Internal email API - has its own origin validation
  '/api/feature-requests/send-email', // Internal email API - has its own origin validation
]);
// Auth pages that should redirect to home if user is logged in
const AUTH_PATHS = new Set(['/login', '/signup']);

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const startTime = Date.now();

  // Log ALL API requests (except /api/logs to prevent infinite loop)
  const isApiRoute = url.pathname.startsWith('/api');
  if (isApiRoute && !url.pathname.startsWith('/api/logs')) {
    const requestId = crypto.randomUUID();

    logger.info('api.request', `${req.method} ${url.pathname}`, {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      requestId,
      userAgent: req.headers.get('user-agent') || undefined,
      referer: req.headers.get('referer') || undefined,
    });
  }

  // Skip auth checks for static files
  if (url.pathname.startsWith('/_next') || url.pathname.includes('.')) {
    return NextResponse.next();
  }

  const res = NextResponse.next({ request: { headers: req.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  // OPTIMIZATION: getUser() is safer than getSession() and ensures the session is valid
  // It also automatically handles refreshing the token if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in and trying to access auth pages, redirect to home
  if (user && AUTH_PATHS.has(url.pathname)) {
    return NextResponse.redirect(new URL('/', url.origin));
  }

  // Check if path is public
  const isPublicPath =
    PUBLIC_PATHS.has(url.pathname) ||
    url.pathname.startsWith('/share/') ||
    url.pathname.startsWith('/s/') ||
    url.pathname.startsWith('/api/blueprints/share/') ||
    url.pathname.startsWith('/api/share/');

  // If user is not logged in and trying to access protected pages, redirect to login
  if (!user && !isPublicPath) {
    const redirectUrl = new URL('/login', url.origin);
    redirectUrl.searchParams.set('redirect', url.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Log API response (only for API routes)
  if (isApiRoute && !url.pathname.startsWith('/api/logs')) {
    const duration = Date.now() - startTime;
    logger.info('api.response', `${req.method} ${url.pathname} completed`, {
      method: req.method,
      path: url.pathname,
      duration,
      statusCode: res.status,
    });
  }

  return res;
}

export const config = {
  // Match ALL routes including API routes (exclude only static assets)
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)', // Exclude files with extensions (except API routes)
  ],
};
