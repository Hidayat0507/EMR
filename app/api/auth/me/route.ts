/**
 * GET /api/auth/me
 * Returns current user based on Firebase session cookie.
 * Falls back to Medplum profile if available.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getCurrentProfile, getProfileRole } from '@/lib/server/medplum-auth';

export async function GET(req: NextRequest) {
  const firebaseSession = req.cookies.get('emr_session')?.value;

  // Try Firebase session first (primary auth)
  if (firebaseSession) {
    try {
      const decoded = await adminAuth.verifySessionCookie(firebaseSession, true);
      return NextResponse.json({
        id: decoded.uid,
        resourceType: 'User',
        name: decoded.email || decoded.uid,
        email: decoded.email || null,
        role: (decoded as any).role || 'user',
        provider: 'firebase',
      });
    } catch {
      // fallthrough to Medplum below
    }
  }

  // Fallback to Medplum session if present
  try {
    const profile = await getCurrentProfile(req);
    
    return NextResponse.json({
      id: profile.id,
      resourceType: profile.resourceType,
      name: profile.resourceType === 'Practitioner' 
        ? (profile as any).name?.[0]?.text || 'Unknown'
        : (profile as any).name?.[0]?.text || 'Patient',
      email: profile.resourceType === 'Practitioner'
        ? (profile as any).telecom?.find((t: any) => t.system === 'email')?.value
        : null,
      role: getProfileRole(profile),
      provider: 'medplum',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Not authenticated' },
      { status: 401 }
    );
  }
}







