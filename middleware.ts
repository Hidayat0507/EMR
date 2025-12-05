import { NextRequest, NextResponse } from 'next/server';

// Auth temporarily disabled per request: always allow.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|manifest.json).*)'],
};

