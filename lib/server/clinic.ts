import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const CLINIC_COOKIE_NAME = 'medplum-clinic';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || '';
const isProd = process.env.NODE_ENV === 'production';

export function deriveClinicFromHost(host: string | null): string | null {
  if (!host) return null;

  // Local development fallback.
  if (host.startsWith('localhost') || /^\d{1,3}(\.\d{1,3}){3}/.test(host)) {
    return process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID || 'default';
  }

  const parts = host.split(':')[0].split('.');
  if (parts.length < 3) return null;

  const [subdomain, ...rest] = parts;

  if (BASE_DOMAIN) {
    const baseParts = BASE_DOMAIN.split('.');
    if (rest.join('.') !== baseParts.join('.')) {
      return null;
    }
  }

  if (['www', 'app'].includes(subdomain)) return null;
  return subdomain;
}

/**
 * Resolve clinicId from header or cookie. Returns null if not provided.
 */
export async function getClinicIdFromRequest(req: NextRequest): Promise<string | null> {
  const hostClinicId = deriveClinicFromHost(req.headers.get('host'));

  // In production, clinic must come from host-derived tenant context.
  if (isProd) {
    return hostClinicId;
  }

  const cookieStore = await cookies();
  return (
    req.headers.get('x-clinic-id') ||
    hostClinicId ||
    cookieStore.get(CLINIC_COOKIE_NAME)?.value ||
    null
  );
}
