# What is FHIR Provenance?

## Overview

**Provenance** is a FHIR resource that provides an **audit trail** for clinical data. It answers the question: **"Who did what, when, and why?"**

---

## Purpose

Provenance resources track:
1. **Who** created, modified, or deleted a resource (Practitioner/User)
2. **When** the action occurred (timestamp)
3. **What** was done (CREATE, UPDATE, DELETE)
4. **Why** it was done (reason, activity)
5. **On behalf of** which organization

---

## Why It's Important

### 1. **Compliance & Audit Requirements**
- **HIPAA** requires audit trails for PHI (Protected Health Information)
- **Regulatory compliance** (FDA, CMS) requires tracking of clinical data changes
- **Legal requirements** for medical records

### 2. **Data Integrity**
- Track who created/modified patient data
- Detect unauthorized changes
- Maintain data lineage

### 3. **Accountability**
- Know which practitioner ordered a medication
- Track who entered a diagnosis
- Identify who uploaded a document

### 4. **Troubleshooting**
- Debug data issues ("Who created this?")
- Track data flow between systems
- Investigate discrepancies

---

## Example Use Cases

### Example 1: Medication Order
```
Resource: MedicationRequest (prescription for Aspirin)
Provenance:
  - Who: Dr. Smith (Practitioner/123)
  - When: 2025-01-15 10:30 AM
  - What: CREATE
  - On behalf of: UCC Clinic (Organization/456)
```

### Example 2: Diagnosis Entry
```
Resource: Condition (diagnosis: "Hypertension")
Provenance:
  - Who: Dr. Jones (Practitioner/789)
  - When: 2025-01-15 11:00 AM
  - What: CREATE
  - Activity: Clinical documentation
```

### Example 3: Document Upload
```
Resource: DocumentReference (lab report PDF)
Provenance:
  - Who: Nurse Admin (Practitioner/321)
  - When: 2025-01-15 2:00 PM
  - What: CREATE
  - Activity: Document registration
```

---

## FHIR Provenance Structure

```typescript
{
  resourceType: 'Provenance',
  target: [
    { reference: 'MedicationRequest/123' }  // What resource
  ],
  recorded: '2025-01-15T10:30:00Z',        // When
  agent: [
    {
      who: { reference: 'Practitioner/456' },  // Who
      onBehalfOf: { reference: 'Organization/789' }  // Organization
    }
  ],
  activity: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
        code: 'CREATE',  // What action
        display: 'create'
      }
    ]
  }
}
```

---

## In Your EMR

### Current Status
- ❌ **Provenance service missing** - File doesn't exist
- ❌ **Not integrated** - No audit trail being created
- ⚠️ **Helper exists** - `fhir-helpers.ts` has Provenance support but it's not working

### What You're Missing
Without Provenance, you cannot answer:
- "Who prescribed this medication?"
- "When was this diagnosis entered?"
- "Who uploaded this document?"
- "Which practitioner created this consultation?"

### What You Need
1. **Create `provenance-service.ts`** - Service to create Provenance resources
2. **Integrate into services** - Call after creating resources
3. **Track all changes** - CREATE, UPDATE, DELETE operations

---

## Benefits for Your EMR

1. **Compliance** - Meet HIPAA audit requirements
2. **Accountability** - Know who did what
3. **Security** - Detect unauthorized changes
4. **Quality** - Track data quality issues
5. **Legal** - Support for legal/regulatory inquiries

---

## Implementation Example

```typescript
// After creating a MedicationRequest
const medication = await medplum.createResource(medicationRequest);

// Create Provenance for audit trail
await createProvenanceForResource(
  'MedicationRequest',
  medication.id!,
  practitionerId,      // Who prescribed it
  organizationId,      // Which clinic
  'CREATE'             // What action
);
```

---

## Summary

**Provenance = Audit Trail**

It's like a "paper trail" for digital health records. Every time you create, update, or delete clinical data, Provenance records:
- **Who** did it
- **When** it happened
- **What** was done
- **Why** (if provided)

**Without Provenance, you have no audit trail** - which is a compliance risk and makes troubleshooting difficult.

