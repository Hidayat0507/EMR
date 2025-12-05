# Architecture Clarity: Firebase vs Medplum

**Date:** December 1, 2024  
**Current Status:** 🟡 **Hybrid System** (Not Full "Source of Truth" Yet!)

---

## 🤔 The Confusion

You said: *"I thought Medplum is source of truth?"*

**Reality:** You're in a **transition phase** - running **BOTH** Firebase and Medplum!

---

## 📊 Current Architecture (What's Actually Happening)

### System Flow:

```
User Creates Patient
       ↓
   [Your App]
       ↓
┌──────────────────────────────────────┐
│  1. Save to Firebase FIRST           │  ← Primary storage
│     (lib/models.ts:247)              │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  2. THEN sync to Medplum             │  ← Secondary sync
│     (background, non-blocking)       │
│     (lib/models.ts:255-283)          │
└──────────────────────────────────────┘
```

**Proof from your code** (`lib/models.ts:243-286`):

```typescript
export async function createPatient(data: Omit<Patient, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const now = Timestamp.now();
  
  // ❌ Still saving to Firebase FIRST
  const docRef = await addDoc(collection(db, PATIENTS), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  // 🟡 THEN syncing to Medplum in background (doesn't block)
  (async () => {
    try {
      const { toFhirPatient } = await import('@/lib/fhir/mappers'); // ← MAPPER
      const { id: medplumId } = await toFhirPatient(patient);        // ← Converting
      
      // Storing Medplum ID back in Firebase
      await updateDoc(doc(db, PATIENTS, docRef.id), {
        _medplumId: medplumId,           // ← Link to Medplum
        _syncedToMedplum: true,          // ← Sync flag
        _syncedAt: Timestamp.now(),
      });
    } catch (error) {
      // If Medplum fails, app still works (Firebase is primary)
      console.warn(`⚠️ Not synced to Medplum:`, error.message);
    }
  })();
  
  return docRef.id; // ← Returns Firebase ID
}
```

---

## 🎯 What "Mapper" Actually Means

**Mapper** = Data Translator/Converter

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  Firebase Format        │ MAPPER  │  FHIR Format             │
│  (Your App Model)       │ ──────→ │  (Medplum/FHIR Standard) │
├─────────────────────────┤         ├──────────────────────────┤
│ {                       │         │ {                        │
│   fullName: "John Doe", │         │   resourceType: "Patient"│
│   nric: "123456",       │         │   name: [{               │
│   phone: "0123456789",  │         │     family: "Doe",       │
│   dateOfBirth: Date,    │         │     given: ["John"]      │
│   ...                   │         │   }],                    │
│ }                       │         │   birthDate: "1990-01-01"│
│                         │         │   ...                    │
└─────────────────────────┘         └──────────────────────────┘
```

**Why you need mappers:**
- Your app uses simple TypeScript interfaces
- FHIR has complex, structured format
- Mapper bridges the gap

---

## 🔍 Your Current System - THREE Storage Patterns

### Pattern 1: **Firebase → Medplum Sync** (Legacy)
**File:** `lib/models.ts`  
**Used by:** Old code, existing patients

```typescript
// 1. Save to Firebase (primary)
Firebase.save(patient)
// 2. Sync to Medplum (background)
Medplum.create(toFhirPatient(patient)) // ← MAPPER HERE
```

### Pattern 2: **Direct to Medplum** (New)
**File:** `lib/fhir/patient-service.ts`  
**Used by:** New implementations

```typescript
// Save directly to Medplum (no Firebase)
const fhirPatient = mapToFhir(patientData) // ← MAPPER
await medplum.createResource(fhirPatient)
```

### Pattern 3: **Dual Path with Fallback**
**File:** `lib/fhir/mappers.ts`  
**Used by:** Migration code

```typescript
export async function toFhirPatient(app: AppPatient) {
  const resource = { /* FHIR format */ }; // ← MAPPING HERE
  
  if (isMedplumConfigured()) {
    // Use Medplum if available
    return await createFhirResource(resource);
  }
  
  // Fallback to Firebase
  return await saveFhirResource(resource); // ← Still saves to Firebase!
}
```

---

## 🚨 The Problem: You Have TWO Sources of Truth

```
┌──────────────────┐         ┌──────────────────┐
│    Firebase      │         │     Medplum      │
│  (Firestore)     │         │  (FHIR Server)   │
├──────────────────┤         ├──────────────────┤
│  patients/       │◄──sync─►│  Patient/        │
│  consultations/  │◄──sync─►│  Encounter/      │
│  appointments/   │◄──sync─►│  Appointment/    │
└──────────────────┘         └──────────────────┘
     ↑ PRIMARY                     ↑ SECONDARY
```

**Issues:**
1. ❌ Data can get out of sync
2. ❌ Duplicate storage costs
3. ❌ Complex sync logic
4. ❌ Two places to query
5. ❌ Unclear which is "truth"

---

## ✅ True "Source of Truth" Architecture

What you **should** have (and probably intended):

```
User Creates Patient
       ↓
   [Your App]
       ↓
   [MAPPER]  ← Convert app format → FHIR format
       ↓
┌──────────────────────────────────────┐
│        Medplum (FHIR Server)         │  ← ONLY source of truth
│  - Patient resources                 │
│  - Encounter resources               │
│  - All FHIR data                     │
└──────────────────────────────────────┘
       ↑
       │ Query/Read
       ↓
   [Your App]
       ↑
       │ Display
       ↓
    [User Views]
```

**Benefits:**
- ✅ ONE source of truth (Medplum)
- ✅ No sync complexity
- ✅ Standard FHIR queries
- ✅ Interoperable with other systems
- ✅ No Firebase needed (or minimal cache only)

---

## 🎯 Why You Still Need Mappers (Even with Medplum as Source)

### Your App UI Layer:
```typescript
// Simple interface for your React components
interface Patient {
  fullName: string;
  nric: string;
  phone: string;
  dateOfBirth: Date;
}
```

### FHIR Format in Medplum:
```typescript
// Complex FHIR structure
{
  resourceType: "Patient",
  name: [{
    use: "official",
    family: "Doe",
    given: ["John"],
    text: "John Doe"
  }],
  identifier: [{
    system: "http://www.nric.gov.my",
    value: "123456",
    use: "official"
  }],
  telecom: [{
    system: "phone",
    value: "0123456789",
    use: "mobile"
  }],
  birthDate: "1990-01-01"
}
```

**Mappers are needed for:**
1. **Write Path:** App Format → FHIR Format (when saving)
2. **Read Path:** FHIR Format → App Format (when displaying)

```
┌─────────────┐  toFhirPatient()   ┌──────────┐
│  App Model  │ ─────────────────→ │  Medplum │
│  (Simple)   │                    │  (FHIR)  │
│             │ ←───────────────── │          │
└─────────────┘  fromFhirPatient() └──────────┘
```

---

## 📋 Migration Path Forward

### Option 1: **Full FHIR (Recommended)**
Stop using Firebase, Medplum only:

```typescript
// lib/fhir/patient.ts
export async function createPatient(data: PatientInput): Promise<string> {
  // Convert to FHIR
  const fhirPatient = toFhirPatient(data); // ← MAPPER
  
  // Save directly to Medplum (source of truth)
  const created = await medplum.createResource(fhirPatient);
  
  return created.id; // ← Medplum ID
}

export async function getPatient(id: string): Promise<Patient> {
  // Read from Medplum
  const fhirPatient = await medplum.readResource('Patient', id);
  
  // Convert back to app format
  return fromFhirPatient(fhirPatient); // ← REVERSE MAPPER
}
```

### Option 2: **Hybrid with Cache**
Medplum is truth, Firebase is read cache:

```typescript
export async function createPatient(data: PatientInput): Promise<string> {
  // 1. Save to Medplum (source of truth)
  const fhirPatient = toFhirPatient(data);
  const created = await medplum.createResource(fhirPatient);
  
  // 2. Cache in Firebase for fast reads (optional)
  await firebase.set(`patient_cache/${created.id}`, {
    ...data,
    medplumId: created.id,
    cachedAt: Date.now()
  });
  
  return created.id;
}
```

### Option 3: **Keep Current (Not Recommended)**
Firebase primary, Medplum sync:
- ❌ Complex
- ❌ Sync issues
- ❌ Not true "source of truth"

---

## 🔧 What Needs to Change

### Current Files That Mix Systems:

1. **`lib/models.ts`** - Still using Firebase as primary
   ```typescript
   // ❌ Current: Firebase primary
   await addDoc(collection(db, PATIENTS), data);
   
   // ✅ Should be: Medplum primary
   await medplum.createResource(toFhirPatient(data));
   ```

2. **`lib/fhir/mappers.ts`** - Has fallback to Firebase
   ```typescript
   // ❌ Current: Dual path
   if (isMedplumConfigured()) {
     return createFhirResource(resource);
   }
   return saveFhirResource(resource); // ← Firebase fallback
   
   // ✅ Should be: Medplum only
   return createFhirResource(resource);
   ```

3. **`lib/fhir/firestore.ts`** - Shouldn't exist for FHIR
   ```typescript
   // ❌ This file stores FHIR in Firebase
   // ✅ Should only use Medplum client
   ```

---

## 🎯 Action Plan

### Phase 1: Decide Architecture
- [ ] Choose: Full FHIR or Hybrid with cache?
- [ ] Document decision
- [ ] Plan migration

### Phase 2: Clean Up Mappers
- [ ] Keep: Format conversion (App ↔ FHIR)
- [ ] Remove: Dual storage logic
- [ ] Fix: Use proper FHIR types (remove `as any`)

### Phase 3: Single Source of Truth
- [ ] Update `lib/models.ts` to use Medplum
- [ ] Remove or repurpose Firebase
- [ ] Update all API routes

### Phase 4: Migrate Existing Data
- [ ] Export Firebase → Medplum
- [ ] Verify data integrity
- [ ] Decommission Firebase

---

## 💡 Key Takeaways

1. **Mappers ≠ Source of Truth**
   - Mappers = Data format converters
   - Source of Truth = Where data is stored

2. **You Currently Have:**
   - Firebase as primary storage
   - Medplum as secondary sync
   - Mappers converting between them

3. **You Should Have:**
   - Medplum as ONLY storage (source of truth)
   - Mappers ONLY for format conversion
   - Firebase removed or minimal cache

4. **Mappers Will Always Be Needed:**
   - To convert: Your App UI Format ↔ FHIR Format
   - Even with Medplum as source of truth
   - They're just data translators

---

**Next Steps:** 
1. Read this document
2. Decide: Full FHIR or Hybrid?
3. Then we can clean up the code accordingly

**Questions?** Ask about any section that's unclear!








