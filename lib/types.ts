// lib/types.ts
import { Consultation } from "./models"; // Assuming Consultation is defined in models.ts

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