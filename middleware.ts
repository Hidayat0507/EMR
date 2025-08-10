import { NextResponse, NextRequest } from 'next/server';

// Protect all app routes except public ones
const PUBLIC_PATHS: RegExp[] = [
  /^\/login(?:$|\/)/,
  /^\/logout(?:$|\/)/,
  /^\/api\/auth\/session(?:$|\/)/,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Optional HTTP Basic Auth gate (useful for staging)
  const basicAuthEnabled = process.env.BASIC_AUTH_ENABLED === 'true';
  if (basicAuthEnabled) {
    const header = req.headers.get('authorization') || '';
    const expectedUser = process.env.BASIC_AUTH_USERNAME || '';
    const expectedPass = process.env.BASIC_AUTH_PASSWORD || '';
    const unauthorized = () => new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Protected"' },
    });

    if (!header.startsWith('Basic ')) {
      return unauthorized();
    }
    try {
      const base64 = header.slice(6);
      const decoded = atob(base64);
      const [user, pass] = decoded.split(':');
      if (user !== expectedUser || pass !== expectedPass) {
        return unauthorized();
      }
    } catch {
      return unauthorized();
    }
  }

  // Skip public paths
  if (PUBLIC_PATHS.some((rx) => rx.test(pathname))) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('emr_session')?.value;
  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|manifest.json).*)'],
};


