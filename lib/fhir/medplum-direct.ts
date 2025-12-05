/**
 * Direct Medplum REST API calls without MedplumClient
 * This works in server-side Node.js environments
 */

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;
const MEDPLUM_EMAIL = process.env.MEDPLUM_EMAIL;
const MEDPLUM_PASSWORD = process.env.MEDPLUM_PASSWORD;

let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Login to Medplum and get access token
 * Supports two methods:
 * 1. Client Credentials (preferred for backend)
 * 2. Email/Password (fallback, has limitations)
 */
async function login(): Promise<string> {
  // Prefer client_credentials flow if available
  if (MEDPLUM_CLIENT_ID && MEDPLUM_CLIENT_SECRET) {
    console.log('🔐 Authenticating with client_credentials...');
    
    // Encode credentials as Basic Auth
    const credentials = Buffer.from(`${MEDPLUM_CLIENT_ID}:${MEDPLUM_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(`${MEDPLUM_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Medplum client_credentials auth failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.access_token) {
      console.log('✅ Authenticated with client_credentials');
      return tokenData.access_token;
    }
  }

  // Fallback to email/password (has limitations)
  if (!MEDPLUM_EMAIL || !MEDPLUM_PASSWORD) {
    throw new Error('Neither client credentials (MEDPLUM_CLIENT_ID/SECRET) nor email/password (MEDPLUM_EMAIL/PASSWORD) are configured');
  }

  console.warn('⚠️  Using email/password auth (limited, use client_credentials instead)');
  throw new Error('Email/password authentication is not supported for backend operations. Please create a ClientApplication and use client_credentials.');
}

/**
 * Get a valid access token (cached or fresh)
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (cachedAccessToken && now < tokenExpiry) {
    return cachedAccessToken;
  }

  cachedAccessToken = await login();
  // Tokens typically last 1 hour, refresh after 50 minutes to be safe
  tokenExpiry = now + 50 * 60 * 1000;
  
  return cachedAccessToken;
}

/**
 * Create a FHIR resource in Medplum
 */
export async function createFhirResource<T extends { resourceType: string }>(
  resource: T
): Promise<T & { id: string }> {
  const token = await getAccessToken();
  
  const response = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/${resource.resourceType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(resource),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ${resource.resourceType}: ${response.status} ${error}`);
  }

  const created = await response.json();
  console.log(`✅ Created ${resource.resourceType}/${created.id}`);
  
  return created;
}

/**
 * Check if Medplum is configured and accessible
 */
export function isMedplumConfigured(): boolean {
  return Boolean(
    (MEDPLUM_CLIENT_ID && MEDPLUM_CLIENT_SECRET) || 
    (MEDPLUM_EMAIL && MEDPLUM_PASSWORD)
  );
}

