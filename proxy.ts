import { NextRequest, NextResponse } from 'next/server';

const CLINIC_COOKIE_NAME = 'medplum-clinic';
const SESSION_COOKIE_NAME = 'medplum-session';
const BOOTSTRAP_COOKIE_NAME = 'medplum-sso-bootstrap';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || ''; // e.g. example.com
const AUTH_SUBDOMAIN = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'auth';
const LANDING_PATH = process.env.NEXT_PUBLIC_LANDING_PATH || '/landing';
const AUTH_DISABLED =
  process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' || process.env.DISABLE_AUTH === 'true';
const PUBLIC_PATH_PREFIXES = ['/login', '/landing'];
const PUBLIC_API_PATHS = new Set([
  '/api/auth/medplum-session',
  '/api/auth/me',
]);
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours
const isProd = process.env.NODE_ENV === 'production';

function deriveClinicFromHost(host: string | null): string | null {
  if (!host) return null;

  // For localhost/development, use default clinic ID from env or 'default'
  if (host.startsWith('localhost') || /^\d{1,3}(\.\d{1,3}){3}/.test(host)) {
    return process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID || 'default';
  }

  const parts = host.split(':')[0].split('.');
  if (parts.length < 3) return null; // no subdomain present

  const [subdomain, ...rest] = parts;

  // If BASE_DOMAIN is set, ensure the host matches it before trusting the subdomain
  if (BASE_DOMAIN) {
    const baseParts = BASE_DOMAIN.split('.');
    if (rest.join('.') !== baseParts.join('.')) {
      return null;
    }
  }

  // Ignore common non-clinic subdomains
  if (['www', 'app', AUTH_SUBDOMAIN].includes(subdomain)) return null;

  return subdomain;
}

function getHostname(host: string | null): string {
  return (host || '').split(':')[0];
}

function isAuthHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (!hostname) return false;
  if (!BASE_DOMAIN) return false;
  return hostname === `${AUTH_SUBDOMAIN}.${BASE_DOMAIN}`;
}

function buildAuthLoginUrl(req: NextRequest): URL {
  if (!BASE_DOMAIN) {
    return new URL('/login', req.url);
  }
  const protocol = req.nextUrl.protocol || (isProd ? 'https:' : 'http:');
  const authOrigin = `${protocol}//${AUTH_SUBDOMAIN}.${BASE_DOMAIN}`;
  const loginUrl = new URL('/login', authOrigin);
  loginUrl.searchParams.set('next', req.nextUrl.href);
  return loginUrl;
}

function isBaseDomainHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0];

  if (hostname.startsWith('localhost') || /^\d{1,3}(\.\d{1,3}){3}/.test(hostname)) {
    return false;
  }

  if (BASE_DOMAIN) {
    return hostname === BASE_DOMAIN;
  }

  const parts = hostname.split('.');
  return parts.length === 2;
}

// Auth is intentionally open, but we still derive clinic from subdomain to scope requests.
export function proxy(req: NextRequest) {
  const host = req.headers.get('host');
  const clinicId = deriveClinicFromHost(host);
  const authHost = isAuthHost(host);
  const { pathname } = req.nextUrl;
  const isLoginPath = pathname === '/login' || pathname.startsWith('/login/');
  const isApiPath = pathname.startsWith('/api/');
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const bootstrapSession = req.cookies.get(BOOTSTRAP_COOKIE_NAME)?.value;
  const isPublicPath =
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (isApiPath && PUBLIC_API_PATHS.has(pathname));

  if (!clinicId && pathname === '/' && isBaseDomainHost(host)) {
    return NextResponse.redirect(new URL(LANDING_PATH, req.url));
  }

  // Centralize username/password login on auth.<base-domain>.
  if (isLoginPath && !authHost && BASE_DOMAIN) {
    const loginUrl = buildAuthLoginUrl(req);
    const existingNext = req.nextUrl.searchParams.get('next');
    if (existingNext) {
      loginUrl.searchParams.set('next', existingNext);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Promote a short-lived bootstrap cookie into a host-only clinic session cookie.
  if (clinicId && !hasSession && bootstrapSession) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('authorization', `Bearer ${bootstrapSession}`);
    const promoted = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    promoted.cookies.set(SESSION_COOKIE_NAME, bootstrapSession, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    if (BASE_DOMAIN) {
      promoted.cookies.set(BOOTSTRAP_COOKIE_NAME, '', {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        domain: `.${BASE_DOMAIN}`,
      });
    } else {
      promoted.cookies.delete(BOOTSTRAP_COOKIE_NAME);
    }

    const existingClinic = req.cookies.get(CLINIC_COOKIE_NAME)?.value;
    if (existingClinic !== clinicId) {
      promoted.cookies.set(CLINIC_COOKIE_NAME, clinicId, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }
    return promoted;
  }

  if (clinicId && !AUTH_DISABLED && !hasSession && !isPublicPath) {
    if (isApiPath) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = authHost
      ? new URL('/login', req.url)
      : buildAuthLoginUrl(req);
    if (authHost) {
      loginUrl.searchParams.set('next', `${pathname}${req.nextUrl.search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  if (clinicId) {
    const existing = req.cookies.get(CLINIC_COOKIE_NAME)?.value;
    if (existing !== clinicId) {
      res.cookies.set(CLINIC_COOKIE_NAME, clinicId, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|manifest.json).*)'],
};
