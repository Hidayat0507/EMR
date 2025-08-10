import { NextResponse, NextRequest } from 'next/server';

// Protect all app routes except public ones
const PUBLIC_PATHS: RegExp[] = [
  /^\/login(?:$|\/)/,
  /^\/api\/ocr(?:$|\/)/, // still validated inside route
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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


