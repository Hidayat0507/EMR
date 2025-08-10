import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

type AuditLog = {
  action: string;
  subjectType: 'patient' | 'consultation' | 'prescription' | 'inventory' | 'billing' | 'fhir' | string;
  subjectId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: any;
};

export async function writeAuditLog(entry: AuditLog): Promise<void> {
  try {
    const payload: AuditLog = {
      ...entry,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'audit_logs'), payload as any);
  } catch (e) {
    // Best-effort; do not block main flow
    console.warn('Failed to write audit log');
  }
}


