# 👨‍💻 Medplum Authentication - Developer Guide

## Client-Side Authentication

### Using the Auth Hook

```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';

export default function MyComponent() {
  const { 
    medplum,        // MedplumClient instance
    profile,        // Current user's FHIR profile
    loading,        // Auth state loading
    isAuthenticated, // Boolean
    signIn,         // Login function
    signOut,        // Logout function
  } = useMedplumAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return (
    <div>
      <h1>Welcome {(profile as any)?.name?.[0]?.text}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Accessing Medplum Client

```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';
import { useEffect, useState } from 'react';

export default function PatientList() {
  const { medplum, isAuthenticated } = useMedplumAuth();
  const [patients, setPatients] = useState([]);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    medplum.searchResources('Patient', { _count: 10 })
      .then(setPatients)
      .catch(console.error);
  }, [medplum, isAuthenticated]);
  
  return (
    <ul>
      {patients.map(p => (
        <li key={p.id}>{p.name?.[0]?.text}</li>
      ))}
    </ul>
  );
}
```

---

## Server-Side Authentication

### API Routes

```typescript
// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/medplum-auth';

export async function GET(req: NextRequest) {
  try {
    // Automatically authenticated & enforces AccessPolicy
    const medplum = await requireAuth(req);
    
    const patients = await medplum.searchResources('Patient', {
      _count: 50,
      _sort: '-_lastUpdated',
    });
    
    return NextResponse.json(patients);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }
}

export async function POST(req: NextRequest) {
  const medplum = await requireAuth(req);
  const data = await req.json();
  
  const patient = await medplum.createResource({
    resourceType: 'Patient',
    name: [{ text: data.name }],
    // ...
  });
  
  return NextResponse.json(patient);
}
```

### Server Components

```typescript
// app/dashboard/page.tsx
import { getCurrentProfile } from '@/lib/server/medplum-auth';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  
  const name = profile.resourceType === 'Practitioner'
    ? (profile as any).name?.[0]?.text
    : 'User';
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {name}</p>
    </div>
  );
}
```

### Server Actions

```typescript
'use server';

import { requireAuth } from '@/lib/server/medplum-auth';

export async function createPatient(formData: FormData) {
  const medplum = await requireAuth();
  
  const patient = await medplum.createResource({
    resourceType: 'Patient',
    name: [{ 
      text: formData.get('name') as string,
      family: formData.get('lastName') as string,
      given: [formData.get('firstName') as string],
    }],
    birthDate: formData.get('dob') as string,
    gender: formData.get('gender') as 'male' | 'female' | 'other',
  });
  
  return { success: true, patientId: patient.id };
}
```

---

## Available Helper Functions

### `lib/server/medplum-auth.ts`

```typescript
// Get authenticated Medplum client for current request
const medplum = await getMedplumForRequest(req);

// Get current user's profile
const profile = await getCurrentProfile(req);

// Require authentication (throws if not authenticated)
const medplum = await requireAuth(req);

// Optional authentication (returns null if not authenticated)
const medplum = await optionalAuth(req);

// Get admin Medplum client (uses client credentials)
const medplum = await getAdminMedplum();

// Check if user has specific role
const isAllowed = await hasRole(req, ['admin', 'doctor']);

// Get role from profile
const role = getProfileRole(profile);
```

---

## Role-Based UI

### Hide Features by Role

```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';

export default function AdminPanel() {
  const { profile } = useMedplumAuth();
  
  // Only show for Practitioners (not Patients)
  if (profile?.resourceType !== 'Practitioner') {
    return <div>Access denied</div>;
  }
  
  // Check PractitionerRole for more specific permissions
  // (would need to fetch PractitionerRole resource)
  
  return <div>Admin Panel Content</div>;
}
```

### Conditional Rendering

```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';

export default function Navbar() {
  const { profile } = useMedplumAuth();
  
  const isPractitioner = profile?.resourceType === 'Practitioner';
  const isPatient = profile?.resourceType === 'Patient';
  
  return (
    <nav>
      {isPractitioner && (
        <>
          <a href="/patients">Patients</a>
          <a href="/consultations">Consultations</a>
          <a href="/analytics">Analytics</a>
        </>
      )}
      
      {isPatient && (
        <>
          <a href="/my-records">My Records</a>
          <a href="/appointments">Appointments</a>
        </>
      )}
    </nav>
  );
}
```

---

## Working with FHIR Resources

### Automatic Permission Enforcement

```typescript
// Medplum automatically filters based on AccessPolicy
const medplum = await requireAuth(req);

// Doctor with patient compartment access:
// Only returns patients they have access to
const patients = await medplum.searchResources('Patient');

// Nurse trying to create prescription:
// Will throw 403 Forbidden error
try {
  await medplum.createResource({
    resourceType: 'MedicationRequest',
    // ...
  });
} catch (error) {
  // Error: Access denied
}
```

### Reading Current User's Profile

```typescript
const profile = await medplum.getProfile();

if (profile.resourceType === 'Practitioner') {
  console.log('Practitioner:', (profile as any).name?.[0]?.text);
  console.log('Email:', (profile as any).telecom?.find(t => t.system === 'email')?.value);
} else if (profile.resourceType === 'Patient') {
  console.log('Patient:', (profile as any).name?.[0]?.text);
}
```

---

## Audit Trail

### Viewing Audit Events

```typescript
import { getAdminMedplum } from '@/lib/server/medplum-auth';

export async function getAuditTrail(patientId: string) {
  const medplum = await getAdminMedplum();
  
  const auditEvents = await medplum.searchResources('AuditEvent', {
    entity: `Patient/${patientId}`,
    _sort: '-recorded',
    _count: 50,
  });
  
  return auditEvents.map(event => ({
    action: event.action, // 'C', 'R', 'U', 'D'
    user: event.agent?.[0]?.who?.display,
    timestamp: event.recorded,
    resource: event.entity?.[0]?.what?.reference,
  }));
}
```

---

## Best Practices

### 1. Always Use TypeScript Types

```typescript
import type { Patient, Practitioner } from '@medplum/fhirtypes';

const patient = await medplum.createResource<Patient>({
  resourceType: 'Patient',
  // TypeScript will autocomplete fields
});
```

### 2. Error Handling

```typescript
try {
  const medplum = await requireAuth(req);
  // ...
} catch (error: any) {
  if (error.message.includes('Authentication required')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (error.message.includes('Access denied')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}
```

### 3. Use Admin Client Sparingly

```typescript
// ❌ Don't use for user requests
const medplum = await getAdminMedplum();
const patients = await medplum.searchResources('Patient');
// This bypasses ALL permissions!

// ✅ Do use for background jobs
const medplum = await getAdminMedplum();
await medplum.executeBatch(migrationBundle);
```

### 4. Validate Before Creating Resources

```typescript
import { z } from 'zod';

const patientSchema = z.object({
  name: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other']),
});

export async function POST(req: NextRequest) {
  const medplum = await requireAuth(req);
  const data = await req.json();
  
  // Validate
  const validated = patientSchema.parse(data);
  
  // Create
  const patient = await medplum.createResource<Patient>({
    resourceType: 'Patient',
    name: [{ text: validated.name }],
    birthDate: validated.dob,
    gender: validated.gender,
  });
  
  return NextResponse.json(patient);
}
```

---

## Common Patterns

### Protected Page

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/server/medplum-auth';

export default async function DashboardPage() {
  let profile;
  
  try {
    profile = await getCurrentProfile();
  } catch {
    redirect('/login');
  }
  
  return <div>Dashboard for {(profile as any).name?.[0]?.text}</div>;
}
```

### Loading User Data

```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';
import { useEffect, useState } from 'react';

export default function MyProfile() {
  const { medplum, profile } = useMedplumAuth();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!profile) return;
    
    // Fetch additional data
    medplum.readResource(profile.resourceType, profile.id!)
      .then(setData);
  }, [medplum, profile]);
  
  if (!data) return <div>Loading...</div>;
  
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

---

## Related Documentation

- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Medplum Docs**: https://www.medplum.com/docs








