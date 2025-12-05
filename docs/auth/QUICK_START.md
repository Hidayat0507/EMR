# ⚡ Quick Start: Medplum Auth (5 Minutes)

## Prerequisites

- ✅ Medplum server running (http://localhost:8103)
- ✅ Admin credentials in `.env.local`

---

## Setup in 5 Steps

### 1. Test Connection

```bash
bun run scripts/setup/quick-test-medplum.ts
```

Expected: ✅ Medplum server is running

### 2. Create Access Policies

```bash
bun run scripts/setup/setup-access-policies.ts
```

**IMPORTANT:** Copy the policy IDs to `.env.local`:

```bash
MEDPLUM_POLICY_ADMIN=AccessPolicy/xxx
MEDPLUM_POLICY_DOCTOR=AccessPolicy/xxx
MEDPLUM_POLICY_NURSE=AccessPolicy/xxx
MEDPLUM_POLICY_BILLING=AccessPolicy/xxx
MEDPLUM_POLICY_PATIENT=AccessPolicy/xxx
```

### 3. Create Test User

Open Medplum UI: **http://localhost:3001**
1. Go to **Admin → Users → Invite User**
2. Enter email & password
3. Select **Access Policy** (Doctor, Nurse, etc.)
4. Click **Create**

### 4. Start Your App

```bash
bun run dev
```

### 5. Test Login

Visit **http://localhost:3000/login** and sign in!

---

## Quick Code Examples

### Client Component

```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';

export default function MyComponent() {
  const { profile, isAuthenticated } = useMedplumAuth();
  
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return <div>Welcome {(profile as any)?.name?.[0]?.text}</div>;
}
```

### API Route

```typescript
import { requireAuth } from '@/lib/server/medplum-auth';

export async function GET(req: NextRequest) {
  const medplum = await requireAuth(req);
  const patients = await medplum.searchResources('Patient');
  return NextResponse.json(patients);
}
```

---

## Need More Details?

- **Complete Setup**: [SETUP.md](./SETUP.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**That's it!** 🎉 You're ready to use Medplum authentication.








