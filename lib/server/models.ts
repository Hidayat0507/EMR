import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import type { Consultation, Patient } from "@/lib/models";

const PATIENT_TIMESTAMP_FIELDS = [
  "createdAt",
  "updatedAt",
  "dateOfBirth",
  "lastVisit",
  "upcomingAppointment",
  "queueAddedAt",
] as const;

const CONSULTATION_TIMESTAMP_FIELDS = ["date", "createdAt", "updatedAt"] as const;

type TimestampField = typeof PATIENT_TIMESTAMP_FIELDS[number] | typeof CONSULTATION_TIMESTAMP_FIELDS[number];

function coerceDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object" && value !== null) {
    const withToDate = value as { toDate?: () => Date };
    if (typeof withToDate.toDate === "function") {
      const date = withToDate.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function convertTimestamps<T extends DocumentData>(data: T, fields: readonly TimestampField[]): T {
  const result: Record<string, unknown> = { ...data };

  for (const field of fields) {
    if (!(field in result)) {
      continue;
    }

    const coerced = coerceDate(result[field]);
    if (coerced) {
      result[field] = coerced;
    }
  }

  return result as T;
}

function mapSnapshot<T>(
  snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
  fields: readonly TimestampField[]
): T {
  const data = snap.data();
  if (!data) {
    return { id: snap.id } as T;
  }

  const converted = convertTimestamps(data, fields);
  return { id: snap.id, ...converted } as T;
}

export async function getPatientByIdAdmin(id: string): Promise<Patient | null> {
  const snapshot = await adminDb.collection("patients").doc(id).get();
  if (!snapshot.exists) {
    return null;
  }
  return mapSnapshot<Patient>(snapshot, PATIENT_TIMESTAMP_FIELDS);
}

export async function getConsultationsByPatientIdAdmin(patientId: string): Promise<Consultation[]> {
  const querySnapshot = await adminDb.collection("consultations").where("patientId", "==", patientId).get();
  if (querySnapshot.empty) {
    return [];
  }
  return querySnapshot.docs.map((docSnap) => mapSnapshot<Consultation>(docSnap, CONSULTATION_TIMESTAMP_FIELDS));
}
