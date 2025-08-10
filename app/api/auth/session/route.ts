import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const COOKIE_NAME = 'emr_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const isProd = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing idToken' }), { status: 400 });
    }
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken, true);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid or expired ID token' }), { status: 401 });
    }
    const expiresIn = MAX_AGE_SECONDS * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const headers = new Headers();
    headers.append('Set-Cookie', `${COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`);
    return new Response(JSON.stringify({ user: { uid: decoded.uid, role: (decoded as any).role || null } }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 });
  }
}

export async function DELETE() {
  const headers = new Headers();
  headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; ${isProd ? 'Secure; ' : ''}SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 204, headers });
}


