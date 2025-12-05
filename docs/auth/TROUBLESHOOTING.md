# 🐛 Troubleshooting Medplum Authentication

## Common Issues

### 1. Login Fails with "Invalid Credentials"

**Symptoms:**
- Cannot log in at `/login`
- Error: "Invalid credentials" or "Login failed"

**Solutions:**

```bash
# 1. Check Medplum is running
curl http://localhost:8103/healthcheck
# Expected: 200 OK

# 2. Verify user exists in Medplum UI
# Open http://localhost:3001
# Go to Admin → Users
# Confirm email exists

# 3. Reset password in Medplum UI
# Admin → Users → Select User → Reset Password

# 4. Check browser console for detailed error
# Open DevTools → Console
```

---

### 2. "No Access Token Found"

**Symptoms:**
- API calls return 401 Unauthorized
- Error: "No access token found. User not authenticated."

**Solutions:**

```bash
# User needs to log in again
# Session cookie has expired or wasn't set

# Check cookie in browser
# DevTools → Application → Cookies
# Look for: medplum-session

# If missing, user must log in again
```

---

### 3. "Access Denied" / 403 Errors

**Symptoms:**
- API calls return 403 Forbidden
- Error: "Access denied" or "Insufficient permissions"

**Cause:** User's AccessPolicy doesn't allow the operation

**Solutions:**

```bash
# 1. Check user's access policy in Medplum UI
# http://localhost:3001
# Admin → Users → Select User → View Access Policy

# 2. Verify policy allows the resource
# Admin → Access Policies → Select Policy
# Check resource list

# 3. Assign correct policy to user
# Admin → Users → Select User → Change Access Policy
```

---

### 4. Medplum Server Not Running

**Symptoms:**
- Cannot connect to http://localhost:8103
- Error: "ECONNREFUSED" or "Network error"

**Solutions:**

```bash
# Start Medplum server
cd ~/Documents/Projects/medplum
docker-compose -f docker-compose.full-stack.yml up -d

# Check status
docker ps | grep medplum

# View logs
docker logs medplum-server

# Restart if needed
docker-compose -f docker-compose.full-stack.yml restart
```

---

### 5. Session Cookie Not Being Set

**Symptoms:**
- Login appears successful but redirect fails
- Cookie `medplum-session` not in browser

**Solutions:**

```bash
# 1. Check API endpoint is working
curl -X POST http://localhost:3000/api/auth/medplum-session \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"test"}'

# 2. Verify middleware allows the route
# Check middleware.ts - ensure /api/auth/ is not blocked

# 3. Check browser console for errors
# DevTools → Console → Look for failed requests

# 4. Verify environment variables
# NEXT_PUBLIC_MEDPLUM_BASE_URL must be set
cat .env.local | grep MEDPLUM
```

---

### 6. "Invalid or Expired Access Token"

**Symptoms:**
- API calls work initially, then fail
- Error: "Invalid or expired access token"

**Cause:** Access token expired (typically 1 hour)

**Solutions:**

```typescript
// Tokens are refreshed automatically by MedplumClient
// User just needs to log in again

// Or implement token refresh:
import { useMedplumAuth } from '@/lib/auth-medplum';

function useAutoRefresh() {
  const { medplum, signOut } = useMedplumAuth();
  
  useEffect(() => {
    medplum.addEventListener('change', () => {
      // Token refreshed automatically
    });
    
    // Or force refresh:
    // await medplum.refreshProfile();
  }, [medplum]);
}
```

---

### 7. Cannot Create Users via API

**Symptoms:**
- Script fails with "Permission denied"
- Error creating User resource

**Cause:** User creation requires super admin access

**Solution:**

```bash
# This is expected behavior
# Create users manually in Medplum UI:

# 1. Open http://localhost:3001
# 2. Go to Admin → Users
# 3. Click "Invite User" or "Create User"
# 4. Fill in details and select Access Policy
```

---

### 8. "Project not found" Error

**Symptoms:**
- Login fails with "Project not found"
- User exists but cannot authenticate

**Solutions:**

```bash
# 1. Verify user has ProjectMembership
# In Medplum UI:
# Admin → Project → Members
# Confirm user is listed

# 2. Create ProjectMembership if missing
# Admin → Project → Members → Add Member
# Select: User, Profile (Practitioner/Patient), Access Policy
```

---

### 9. CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Login requests blocked by CORS policy

**Solutions:**

```bash
# 1. Check Medplum server CORS config
# In medplum.config.json:
{
  "baseUrl": "http://localhost:8103",
  "cors": {
    "origin": ["http://localhost:3000"],
    "credentials": true
  }
}

# 2. Restart Medplum server
docker-compose restart medplum-server

# 3. Clear browser cache
# DevTools → Network → Disable cache
```

---

### 10. Development vs Production Issues

**Development (localhost:3000):**
- Use `http://` for Medplum URL
- Cookies: `secure: false`
- CORS: Allow localhost

**Production:**
- Use `https://` for Medplum URL
- Cookies: `secure: true`
- CORS: Allow production domain

**Environment variables:**

```bash
# Development (.env.local)
MEDPLUM_BASE_URL=http://localhost:8103
NEXT_PUBLIC_MEDPLUM_BASE_URL=http://localhost:8103

# Production (.env.production)
MEDPLUM_BASE_URL=https://api.medplum.your-domain.com
NEXT_PUBLIC_MEDPLUM_BASE_URL=https://api.medplum.your-domain.com
```

---

## Diagnostic Commands

### Test Medplum Connection

```bash
bun run scripts/setup/quick-test-medplum.ts
```

### Check Access Policies

```bash
# In Medplum UI
http://localhost:3001
Admin → Access Policies
```

### View Audit Trail

```typescript
import { getAdminMedplum } from '@/lib/server/medplum-auth';

const medplum = await getAdminMedplum();
const auditEvents = await medplum.searchResources('AuditEvent', {
  _sort: '-recorded',
  _count: 50,
});

console.log(auditEvents);
```

### Check User Permissions

```typescript
import { getMedplumForRequest } from '@/lib/server/medplum-auth';

const medplum = await getMedplumForRequest(req);
const profile = await medplum.getProfile();

console.log('User:', profile.resourceType, profile.id);
console.log('Email:', (profile as any).telecom?.[0]?.value);

// Try accessing a resource
try {
  const patients = await medplum.searchResources('Patient', { _count: 1 });
  console.log('✅ Can read patients');
} catch (error) {
  console.log('❌ Cannot read patients:', error.message);
}
```

---

## Debug Mode

### Enable Medplum Logging

```typescript
// lib/auth-medplum.tsx
const medplum = new MedplumClient({
  baseUrl: MEDPLUM_BASE_URL,
  fetch: async (url, options) => {
    console.log('Medplum request:', url, options);
    const response = await fetch(url, options);
    console.log('Medplum response:', response.status);
    return response;
  },
});
```

### Enable Server Logging

```typescript
// lib/server/medplum-auth.ts
export async function getMedplumForRequest(req?: NextRequest) {
  console.log('Getting Medplum client for request');
  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });
  
  // ... rest of code
  
  const profile = await medplum.getProfile();
  console.log('Authenticated as:', profile.resourceType, profile.id);
  
  return medplum;
}
```

---

## Getting Help

### Resources

1. **Medplum Docs**: https://www.medplum.com/docs
2. **FHIR Spec**: https://hl7.org/fhir/
3. **Medplum Discord**: https://discord.gg/medplum
4. **GitHub Issues**: https://github.com/medplum/medplum/issues

### Reporting Issues

When reporting issues, include:
1. Error message (full text)
2. Browser console logs
3. Network tab (failed requests)
4. Medplum server logs (`docker logs medplum-server`)
5. Steps to reproduce
6. Expected vs actual behavior

---

## Still Having Issues?

1. **Run diagnostic**: `bun run scripts/setup/quick-test-medplum.ts`
2. **Check logs**: `docker logs medplum-server`
3. **Review setup**: [SETUP.md](./SETUP.md)
4. **Check examples**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

---

**Most issues are resolved by:**
- ✅ Restarting Medplum server
- ✅ Logging out and back in
- ✅ Checking Access Policy
- ✅ Verifying environment variables








