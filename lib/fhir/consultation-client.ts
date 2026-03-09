/**
 * Client-side wrapper for consultation API (Medplum FHIR)
 * Use this in your React components instead of Firebase
 */

export interface ConsultationInput {
  patientId: string;
  diagnosis: string;
  procedures?: Array<{
    name: string;
    price?: number;
    notes?: string;
    procedureId?: string;
    codingSystem?: string;
    codingCode?: string;
    codingDisplay?: string;
  }>;
  notes?: string;
  chiefComplaint?: string;
  progressNote?: string;
  prescriptions?: Array<{
    medication: { id: string; name: string };
    frequency: string;
    duration: string;
    price?: number;
  }>;
}

export interface Consultation extends ConsultationInput {
  id: string;
  patientName?: string;
  date: Date;
  createdAt: Date;
  updatedAt?: Date;
  progressNote?: string;
}

/**
 * Save a consultation to Medplum (replaces createConsultation from Firebase)
 */
export async function saveConsultation(consultation: ConsultationInput, clinicId?: string): Promise<string> {
  const response = await fetch('/api/consultations', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(clinicId ? { 'X-Clinic-Id': clinicId } : {}),
    },
    body: JSON.stringify(consultation),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to save consultation');
  }

  return data.consultationId;
}

/**
 * Update an existing consultation encounter and related resources
 */
export async function updateConsultation(
  consultationId: string,
  updates: Partial<ConsultationInput>,
  clinicId?: string
): Promise<void> {
  const response = await fetch('/api/consultations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(clinicId ? { 'X-Clinic-Id': clinicId } : {}),
    },
    body: JSON.stringify({ consultationId, updates }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to update consultation');
  }
}

/**
 * Get consultations for a patient from Medplum
 */
export async function getPatientConsultations(patientId: string, clinicId?: string): Promise<Consultation[]> {
  const response = await fetch(`/api/consultations?patientId=${patientId}`, {
    headers: clinicId ? { 'X-Clinic-Id': clinicId } : undefined,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get consultations');
  }

  // Convert date strings to Date objects
  return data.consultations.map((c: any) => ({
    ...c,
    date: new Date(c.date),
    createdAt: new Date(c.createdAt),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
  }));
}

/**
 * Get a specific consultation by ID
 */
export async function getConsultation(consultationId: string, clinicId?: string): Promise<Consultation | null> {
  const response = await fetch(`/api/consultations?id=${consultationId}`, {
    headers: clinicId ? { 'X-Clinic-Id': clinicId } : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(data.error || 'Failed to get consultation');
  }

  const consultation = data.consultation;
  return {
    ...consultation,
    date: new Date(consultation.date),
    createdAt: new Date(consultation.createdAt),
    updatedAt: consultation.updatedAt ? new Date(consultation.updatedAt) : undefined,
  };
}

/**
 * Get recent consultations
 */
export async function getRecentConsultations(limit = 10, clinicId?: string): Promise<Consultation[]> {
  const response = await fetch(`/api/consultations?recent=${limit}`, {
    headers: clinicId ? { 'X-Clinic-Id': clinicId } : undefined,
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to get consultations');
  }

  return data.consultations.map((c: any) => ({
    ...c,
    date: new Date(c.date),
    createdAt: new Date(c.createdAt),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
  }));
}




