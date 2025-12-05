#!/usr/bin/env bun
/**
 * Setup Medplum Access Policies for RBAC
 * Run: bun run scripts/setup-medplum-access-policies.ts
 */

import { MedplumClient } from '@medplum/core';
import type { AccessPolicy } from '@medplum/fhirtypes';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
  console.error('❌ Missing MEDPLUM_CLIENT_ID or MEDPLUM_CLIENT_SECRET');
  console.error('Please set these in your .env.local file');
  process.exit(1);
}

async function setupAccessPolicies() {
  console.log('🔐 Setting up Medplum Access Policies...\n');

  const medplum = new MedplumClient({
    baseUrl: MEDPLUM_BASE_URL,
    clientId: MEDPLUM_CLIENT_ID,
    clientSecret: MEDPLUM_CLIENT_SECRET,
  });

  await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
  console.log('✅ Connected to Medplum\n');

  // 1. Admin Policy - Full access
  const adminPolicy = await medplum.createResource<AccessPolicy>({
    resourceType: 'AccessPolicy',
    name: 'Admin Policy',
    resource: [
      {
        resourceType: 'Patient',
        readonly: false,
      },
      {
        resourceType: 'Practitioner',
        readonly: false,
      },
      {
        resourceType: 'PractitionerRole',
        readonly: false,
      },
      {
        resourceType: 'Encounter',
        readonly: false,
      },
      {
        resourceType: 'Observation',
        readonly: false,
      },
      {
        resourceType: 'Condition',
        readonly: false,
      },
      {
        resourceType: 'Procedure',
        readonly: false,
      },
      {
        resourceType: 'MedicationRequest',
        readonly: false,
      },
      {
        resourceType: 'ServiceRequest',
        readonly: false,
      },
      {
        resourceType: 'DocumentReference',
        readonly: false,
      },
      {
        resourceType: 'Appointment',
        readonly: false,
      },
      {
        resourceType: 'Claim',
        readonly: false,
      },
      {
        resourceType: 'AllergyIntolerance',
        readonly: false,
      },
      {
        resourceType: 'Task',
        readonly: false,
      },
      {
        resourceType: 'AccessPolicy',
        readonly: false,
      },
      {
        resourceType: 'User',
        readonly: false,
      },
      {
        resourceType: 'ProjectMembership',
        readonly: false,
      },
    ],
  });
  console.log(`✅ Created Admin Policy: ${adminPolicy.id}`);

  // 2. Doctor Policy - Full clinical access
  const doctorPolicy = await medplum.createResource<AccessPolicy>({
    resourceType: 'AccessPolicy',
    name: 'Doctor Policy',
    resource: [
      {
        resourceType: 'Patient',
        readonly: false,
      },
      {
        resourceType: 'Practitioner',
        readonly: true, // Can view other practitioners
      },
      {
        resourceType: 'PractitionerRole',
        readonly: true,
      },
      {
        resourceType: 'Encounter',
        readonly: false,
      },
      {
        resourceType: 'Observation',
        readonly: false,
      },
      {
        resourceType: 'Condition',
        readonly: false,
      },
      {
        resourceType: 'Procedure',
        readonly: false,
      },
      {
        resourceType: 'MedicationRequest',
        readonly: false,
      },
      {
        resourceType: 'ServiceRequest',
        readonly: false,
      },
      {
        resourceType: 'DocumentReference',
        readonly: false,
      },
      {
        resourceType: 'Appointment',
        readonly: false,
      },
      {
        resourceType: 'AllergyIntolerance',
        readonly: false,
      },
      {
        resourceType: 'Task',
        readonly: false,
      },
      {
        resourceType: 'Claim',
        readonly: true, // Can view billing
      },
    ],
  });
  console.log(`✅ Created Doctor Policy: ${doctorPolicy.id}`);

  // 3. Nurse Policy - Clinical observation and patient care
  const nursePolicy = await medplum.createResource<AccessPolicy>({
    resourceType: 'AccessPolicy',
    name: 'Nurse Policy',
    resource: [
      {
        resourceType: 'Patient',
        readonly: false, // Can register patients
      },
      {
        resourceType: 'Practitioner',
        readonly: true,
      },
      {
        resourceType: 'Encounter',
        readonly: true, // Can view consultations
      },
      {
        resourceType: 'Observation',
        readonly: false, // Can record vitals
      },
      {
        resourceType: 'Condition',
        readonly: true,
      },
      {
        resourceType: 'Procedure',
        readonly: true,
      },
      {
        resourceType: 'MedicationRequest',
        readonly: true, // View only
      },
      {
        resourceType: 'ServiceRequest',
        readonly: true,
      },
      {
        resourceType: 'DocumentReference',
        readonly: false, // Can upload documents
      },
      {
        resourceType: 'Appointment',
        readonly: false, // Can manage appointments
      },
      {
        resourceType: 'AllergyIntolerance',
        readonly: false,
      },
      {
        resourceType: 'Task',
        readonly: false, // Can manage queue
      },
    ],
  });
  console.log(`✅ Created Nurse Policy: ${nursePolicy.id}`);

  // 4. Billing Policy - Financial and administrative
  const billingPolicy = await medplum.createResource<AccessPolicy>({
    resourceType: 'AccessPolicy',
    name: 'Billing Policy',
    resource: [
      {
        resourceType: 'Patient',
        readonly: true,
      },
      {
        resourceType: 'Encounter',
        readonly: true,
      },
      {
        resourceType: 'Procedure',
        readonly: true,
      },
      {
        resourceType: 'MedicationRequest',
        readonly: true,
      },
      {
        resourceType: 'Claim',
        readonly: false, // Full billing access
      },
      {
        resourceType: 'Invoice',
        readonly: false,
      },
      {
        resourceType: 'Task',
        readonly: true,
      },
    ],
  });
  console.log(`✅ Created Billing Policy: ${billingPolicy.id}`);

  // 5. Patient Portal Policy - Self-service access
  const patientPolicy = await medplum.createResource<AccessPolicy>({
    resourceType: 'AccessPolicy',
    name: 'Patient Portal Policy',
    resource: [
      {
        resourceType: 'Patient',
        criteria: 'Patient?_id=%patient.id', // Only their own record
        readonly: true,
      },
      {
        resourceType: 'Encounter',
        criteria: 'Encounter?subject=Patient/%patient.id',
        readonly: true,
      },
      {
        resourceType: 'Observation',
        criteria: 'Observation?subject=Patient/%patient.id',
        readonly: true,
      },
      {
        resourceType: 'Condition',
        criteria: 'Condition?subject=Patient/%patient.id',
        readonly: true,
      },
      {
        resourceType: 'MedicationRequest',
        criteria: 'MedicationRequest?subject=Patient/%patient.id',
        readonly: true,
      },
      {
        resourceType: 'DocumentReference',
        criteria: 'DocumentReference?subject=Patient/%patient.id',
        readonly: true,
      },
      {
        resourceType: 'Appointment',
        criteria: 'Appointment?patient=Patient/%patient.id',
        readonly: false, // Can book appointments
      },
    ],
  });
  console.log(`✅ Created Patient Portal Policy: ${patientPolicy.id}`);

  console.log('\n✅ All Access Policies created successfully!\n');
  console.log('📋 Policy IDs for reference:');
  console.log(`   Admin:   ${adminPolicy.id}`);
  console.log(`   Doctor:  ${doctorPolicy.id}`);
  console.log(`   Nurse:   ${nursePolicy.id}`);
  console.log(`   Billing: ${billingPolicy.id}`);
  console.log(`   Patient: ${patientPolicy.id}`);
  console.log('\n💾 Save these IDs to your .env.local:');
  console.log(`MEDPLUM_POLICY_ADMIN=${adminPolicy.id}`);
  console.log(`MEDPLUM_POLICY_DOCTOR=${doctorPolicy.id}`);
  console.log(`MEDPLUM_POLICY_NURSE=${nursePolicy.id}`);
  console.log(`MEDPLUM_POLICY_BILLING=${billingPolicy.id}`);
  console.log(`MEDPLUM_POLICY_PATIENT=${patientPolicy.id}`);
}

setupAccessPolicies().catch((error) => {
  console.error('❌ Error setting up access policies:', error);
  process.exit(1);
});








