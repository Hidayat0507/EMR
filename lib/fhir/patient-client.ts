/**
 * Client-side wrapper for Patient API (Medplum FHIR)
 * Use this in your React components
 */

export interface PatientInput {
  fullName: string;
  nric: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone: string;
  address: string;
  postalCode?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: {
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
}

export interface Patient extends PatientInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save a patient to Medplum (replaces createPatient from Firebase)
 */
export async function savePatient(patient: PatientInput, clinicId?: string): Promise<string> {
  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(clinicId ? { 'X-Clinic-Id': clinicId } : {}),
    },
    body: JSON.stringify(patient),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to save patient');
  }

  return data.patientId;
}

/**
 * Get a patient by ID from Medplum
 */
export async function getPatient(patientId: string, clinicId?: string): Promise<Patient | null> {
  const response = await fetch(`/api/patients?id=${patientId}`, {
    headers: clinicId ? { 'X-Clinic-Id': clinicId } : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(data.error || 'Failed to get patient');
  }

  const patient = data.patient;
  return {
    ...patient,
    dateOfBirth: new Date(patient.dateOfBirth),
    createdAt: new Date(patient.createdAt),
    updatedAt: new Date(patient.updatedAt),
  };
}

/**
 * Get all patients from Medplum
 */
export async function getAllPatients(limit = 100, clinicId?: string): Promise<Patient[]> {
  const response = await fetch(`/api/patients?limit=${limit}`, {
    headers: clinicId ? { 'X-Clinic-Id': clinicId } : undefined,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get patients');
  }

  return data.patients.map((p: any) => ({
    ...p,
    dateOfBirth: new Date(p.dateOfBirth),
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));
}

/**
 * Search patients by name or NRIC
 */
export async function searchPatients(query: string, clinicId?: string): Promise<Patient[]> {
  const response = await fetch(`/api/patients?search=${encodeURIComponent(query)}`, {
    headers: clinicId ? { 'X-Clinic-Id': clinicId } : undefined,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to search patients');
  }

  return data.patients.map((p: any) => ({
    ...p,
    dateOfBirth: new Date(p.dateOfBirth),
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  }));
}

/**
 * Update a patient
 */
export async function updatePatient(patientId: string, updates: Partial<PatientInput>, clinicId?: string): Promise<void> {
  const response = await fetch('/api/patients', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...(clinicId ? { 'X-Clinic-Id': clinicId } : {}),
    },
    body: JSON.stringify({ patientId, ...updates }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to update patient');
  }
}







