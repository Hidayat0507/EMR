// lib/types.ts
import type { Consultation } from "./models"; // type-only import to avoid runtime cycles

// Shared type for queue status across different modules
export type QueueStatus = 'waiting' | 'in_consultation' | 'completed' | 'meds_and_bills' | null;

// Type for combining consultation data with patient details for billing/orders page
export type BillableConsultation = Omit<Consultation, 'date' | 'createdAt' | 'updatedAt'> & {
  patientFullName?: string;
  queueStatus?: QueueStatus;
  date: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

// Add other shared types here as needed

// SOAP workflow types removed as flow now returns plain-text SOAP only
