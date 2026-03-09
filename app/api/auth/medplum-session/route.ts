import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'medplum-session';
const CLINIC_COOKIE_NAME = 'medplum-clinic';
const BOOTSTRAP_COOKIE_NAME = 'medplum-sso-bootstrap';
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours
const BOOTSTRAP_MAX_AGE_SECONDS = 60; // 1 minute
const isProd = process.env.NODE_ENV === 'production';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';

/**
 * POST /api/auth/medplum-session
 * Create session cookie from Medplum access token
 */
export async function POST(req: NextRequest) {
  try {
    const { accessToken, clinicId, enableSsoBootstrap } = await req.json();

    if (!accessToken && !clinicId) {
      return NextResponse.json(
        { error: 'Missing access token or clinicId' },
        { status: 400 }
      );
    }

    // Store the access token in an HTTP-only cookie when provided
    const cookieStore = await cookies();
    if (typeof accessToken === 'string' && accessToken.length > 0) {
      cookieStore.set(COOKIE_NAME, accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: MAX_AGE_SECONDS,
        path: '/',
      });

      if (enableSsoBootstrap === true) {
        cookieStore.set(BOOTSTRAP_COOKIE_NAME, accessToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          maxAge: BOOTSTRAP_MAX_AGE_SECONDS,
          path: '/',
          ...(BASE_DOMAIN ? { domain: `.${BASE_DOMAIN}` } : {}),
        });
      }
    }

    // Persist selected clinic to a sibling cookie (not httpOnly so client can read)
    if (typeof clinicId === 'string' && clinicId.trim().length > 0) {
      cookieStore.set(CLINIC_COOKIE_NAME, clinicId, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: MAX_AGE_SECONDS,
        path: '/',
      });
    } else if (clinicId === null) {
      cookieStore.delete(CLINIC_COOKIE_NAME);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating Medplum session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/medplum-session
 * Clear session cookie
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    cookieStore.delete(CLINIC_COOKIE_NAME);
    if (BASE_DOMAIN) {
      cookieStore.set(BOOTSTRAP_COOKIE_NAME, '', {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        domain: `.${BASE_DOMAIN}`,
      });
    } else {
      cookieStore.delete(BOOTSTRAP_COOKIE_NAME);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting Medplum session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/medplum-session
 * Check if session exists
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    const clinicCookie = cookieStore.get(CLINIC_COOKIE_NAME);

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      clinicId: clinicCookie?.value ?? null,
    });
  } catch (error: any) {
    console.error('Error checking Medplum session:', error);
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}





