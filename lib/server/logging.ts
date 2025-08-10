import { adminDb } from '@/lib/firebase-admin';

type AuditLog = {
  action: string;
  subjectType: 'patient' | 'consultation' | 'prescription' | 'inventory' | 'billing' | 'fhir' | string;
  subjectId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: any;
};

export async function writeServerAuditLog(entry: AuditLog): Promise<void> {
  try {
    await adminDb.collection('audit_logs').add({
      ...entry,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // best-effort
  }
}


