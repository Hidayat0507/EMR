# 🔐 Medplum Authentication - Complete Setup Guide

## Overview

Your EMR uses Medplum for authentication with FHIR-native role-based access control.

---

## Environment Variables

Add to `.env.local`:

```bash
# Medplum Connection
MEDPLUM_BASE_URL=http://localhost:8103
NEXT_PUBLIC_MEDPLUM_BASE_URL=http://localhost:8103

# Admin Credentials (for backend operations)
MEDPLUM_CLIENT_ID=your-client-id-here
MEDPLUM_CLIENT_SECRET=your-client-secret-here

# Access Policy IDs (created by setup script)
MEDPLUM_POLICY_ADMIN=AccessPolicy/xxx
MEDPLUM_POLICY_DOCTOR=AccessPolicy/xxx
MEDPLUM_POLICY_NURSE=AccessPolicy/xxx
MEDPLUM_POLICY_BILLING=AccessPolicy/xxx
MEDPLUM_POLICY_PATIENT=AccessPolicy/xxx
```

---

## Setup Steps

### 1. Start Medplum Server

```bash
# Check if running
curl http://localhost:8103/healthcheck

# If not running, start it
cd ~/Documents/Projects/medplum
docker-compose -f docker-compose.full-stack.yml up -d
```

### 2. Create Access Policies

```bash
bun run scripts/setup/setup-access-policies.ts
```

This creates 5 RBAC policies:
- **Admin** - Full system access
- **Doctor** - All clinical data
- **Nurse** - Limited clinical access
- **Billing** - Financial data only
- **Patient** - Own records only

**Save the policy IDs to `.env.local`** (shown in script output).

### 3. Create Users

#### Option A: Medplum UI (Recommended)

1. Open http://localhost:3001
2. Go to **Admin → Users**
3. Click **Invite User** or **Create User**
4. Fill in:
   - Email
   - Password (or send invite)
   - Select **Access Policy**
5. User can now log in

#### Option B: Create Practitioner First

If you want users linked to clinical identities:

```bash
# Create Practitioner resources
bun run scripts/dev/create-practitioner.ts
```

Then link them in Medplum UI:
1. Create User
2. Set **Profile** to link to Practitioner
3. Assign **Access Policy**

### 4. Test Login

```bash
bun run dev
```

Visit http://localhost:3000/login and sign in with created user.

---

## Access Control

### Role Permissions

| Role | Read Access | Write Access | Use Case |
|------|-------------|--------------|----------|
| **Admin** | Everything | Everything | System administrators |
| **Doctor** | All clinical | All clinical | Physicians, prescribe |
| **Nurse** | All clinical | Observations, Tasks | Nurses, vitals |
| **Billing** | Financial only | Claims, Invoices | Billing staff |
| **Patient** | Own records | Appointments only | Patient portal |

### How It Works

Medplum **automatically enforces** AccessPolicy on every API call:

```typescript
const medplum = await getMedplumForRequest(req);

// Only returns resources the user has access to
const patients = await medplum.searchResources('Patient');
```

No manual permission checks needed!

---

## Migration from Firebase

If migrating from Firebase Auth:

1. **Your Firebase auth still works** (we didn't delete it)
2. You can run both in parallel during transition
3. To fully migrate:
   ```bash
   bun run scripts/migration/migrate-firebase-users.ts
   ```
4. Create user accounts for each practitioner in Medplum UI

---

## User Types

### Practitioner (Staff)

Clinical staff members:
- Doctors
- Nurses
- Administrators

Resource type: `Practitioner`

### Patient (Portal Users)

Patients accessing their own records:
- View medical history
- Book appointments
- Access documents

Resource type: `Patient`

---

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Create test users
3. ✅ Test login/logout
4. ✅ Read [Developer Guide](./DEVELOPER_GUIDE.md)
5. ✅ Check [Troubleshooting](./TROUBLESHOOTING.md) if issues

---

## Related Documentation

- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Scripts**: [../../scripts/README.md](../../scripts/README.md)








