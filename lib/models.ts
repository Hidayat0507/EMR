import { db } from "./firebase";
import {
  Timestamp,
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { safeToISOString } from "./utils";
import { QueueStatus, BillableConsultation } from "./types";

export interface Patient {
  id: string;
  fullName: string;
  nric: string;
  dateOfBirth: Date | string;
  gender: "male" | "female" | "other";
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  lastVisit?: Date | string;
  upcomingAppointment?: Date | string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: {
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
  queueStatus?: QueueStatus;
  queueAddedAt?: Date | string | null;
}

export interface Consultation {
  id?: string;
  patientId: string;
  date: Date;
  type?: string;
  doctor?: string;
  chiefComplaint: string;
  diagnosis: string;
  procedures: ProcedureRecord[];
  notes?: string;
  prescriptions: Prescription[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProcedureRecord {
  name: string;
  price?: number;
  notes?: string;
  procedureId?: string;
  codingSystem?: string;
  codingCode?: string;
  codingDisplay?: string;
}

export interface Prescription {
  medication: {
    id: string;
    name: string;
    strength?: string;
  };
  frequency: string;
  duration: string;
  expiryDate?: string;
  price?: number;
}

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientContact?: string;
  clinician: string;
  reason: string;
  type?: string;
  location?: string;
  notes?: string;
  status: AppointmentStatus;
  scheduledAt: Date | string;
  durationMinutes?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  checkInTime?: Date | string | null;
  completedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
}

const PATIENTS = "patients";
const CONSULTATIONS = "consultations";
const REFERRALS = "referrals";
const APPOINTMENTS = "appointments";
const PATIENT_DOCUMENTS = "documents";

type TimestampInput = Timestamp | Date | string | null | undefined;

type DocWithData = {
  id: string;
  data(): DocumentData | undefined;
};

const TIMESTAMP_FIELDS = [
  "createdAt",
  "updatedAt",
  "date",
  "lastVisit",
  "upcomingAppointment",
  "dateOfBirth",
  "queueAddedAt",
  "scheduledAt",
  "checkInTime",
  "completedAt",
  "cancelledAt",
] as const;

const APPOINTMENT_DATE_FIELDS = ["scheduledAt", "checkInTime", "completedAt", "cancelledAt"] as const;
const APPOINTMENT_DATE_FIELD_SET = new Set<string>(APPOINTMENT_DATE_FIELDS);

function coerceDate(value: TimestampInput): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function coerceTimestamp(value: TimestampInput): Timestamp | null {
  const date = coerceDate(value);
  return date ? Timestamp.fromDate(date) : null;
}

function convertTimestamps(data: DocumentData): DocumentData {
  const result: Record<string, unknown> = { ...data };

  for (const field of TIMESTAMP_FIELDS) {
    if (!(field in result)) {
      continue;
    }

    const value = result[field];
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const coerced = coerceDate(value as TimestampInput);
    result[field] = coerced ?? null;
  }

  return result;
}

function mapDocument<T>(doc: DocWithData): T {
  const data = doc.data() ?? {};
  return { id: doc.id, ...convertTimestamps(data) } as T;
}

function requireTimestamp(value: TimestampInput, field: string): Timestamp {
  const timestamp = coerceTimestamp(value);
  if (!timestamp) {
    throw new Error(`Invalid ${field} provided for appointment.`);
  }
  return timestamp;
}

function toIsoIfPossible(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return safeToISOString(value) ?? value;
  }

  return value;
}

function serializeQueuePatient(patient: Patient): Patient {
  return {
    ...patient,
    createdAt: toIsoIfPossible(patient.createdAt) ?? patient.createdAt,
    updatedAt: toIsoIfPossible(patient.updatedAt) ?? patient.updatedAt,
    queueAddedAt: toIsoIfPossible(patient.queueAddedAt) ?? patient.queueAddedAt ?? null,
    dateOfBirth: toIsoIfPossible(patient.dateOfBirth) ?? patient.dateOfBirth,
    lastVisit: toIsoIfPossible(patient.lastVisit) ?? patient.lastVisit,
    upcomingAppointment: toIsoIfPossible(patient.upcomingAppointment) ?? patient.upcomingAppointment,
  };
}

export async function getPatients(): Promise<Patient[]> {
  const snapshot = await getDocs(collection(db, PATIENTS));
  return snapshot.docs.map((docSnap) => mapDocument<Patient>(docSnap));
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const docRef = doc(db, PATIENTS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapDocument<Patient>(docSnap);
}

export async function createPatient(data: Omit<Patient, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, PATIENTS), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getAppointments(statuses?: AppointmentStatus[]): Promise<Appointment[]> {
  const appointmentsQuery = query(collection(db, APPOINTMENTS), orderBy("scheduledAt", "asc"));
  const snapshot = await getDocs(appointmentsQuery);
  const appointments = snapshot.docs.map((docSnap) => mapDocument<Appointment>(docSnap));

  if (statuses && statuses.length > 0) {
    const allowed = new Set(statuses);
    return appointments.filter((appointment) => appointment.status && allowed.has(appointment.status));
  }

  return appointments;
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const docRef = doc(db, APPOINTMENTS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapDocument<Appointment>(docSnap);
}

export interface CreateAppointmentInput {
  patientId: string;
  patientName: string;
  patientContact?: string;
  clinician: string;
  reason: string;
  type?: string;
  location?: string;
  notes?: string;
  scheduledAt: Date | string;
  durationMinutes?: number;
  status?: AppointmentStatus;
}

export async function createAppointment(appointment: CreateAppointmentInput): Promise<string> {
  const now = Timestamp.now();
  const scheduledTimestamp = requireTimestamp(appointment.scheduledAt, "scheduledAt");

  const payload: Record<string, unknown> = {
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    patientContact: appointment.patientContact ?? "",
    clinician: appointment.clinician,
    reason: appointment.reason,
    type: appointment.type ?? "",
    location: appointment.location ?? "",
    notes: appointment.notes ?? "",
    durationMinutes: appointment.durationMinutes ?? null,
    status: appointment.status ?? "scheduled",
    scheduledAt: scheduledTimestamp,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, APPOINTMENTS), payload);

  try {
    const patientRef = doc(db, PATIENTS, appointment.patientId);
    await updateDoc(patientRef, {
      upcomingAppointment: scheduledTimestamp,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to update patient upcoming appointment after scheduling:", error);
  }

  return docRef.id;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  const docRef = doc(db, APPOINTMENTS, id);
  const updatePayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || key === "id" || key === "createdAt") {
      continue;
    }

    if (APPOINTMENT_DATE_FIELD_SET.has(key)) {
      if (value === null) {
        updatePayload[key] = null;
        continue;
      }

      const timestamp = coerceTimestamp(value as TimestampInput);
      if (!timestamp) {
        console.warn(`Skipping invalid date field ${key} when updating appointment ${id}`);
        continue;
      }

      updatePayload[key] = timestamp;
      continue;
    }

    updatePayload[key] = value;
  }

  updatePayload.updatedAt = Timestamp.now();

  await updateDoc(docRef, updatePayload as Record<string, unknown>);
}

export async function getConsultationsByPatientId(patientId: string): Promise<Consultation[]> {
  const consultationQuery = query(collection(db, CONSULTATIONS), where("patientId", "==", patientId));
  const snapshot = await getDocs(consultationQuery);
  return snapshot.docs.map((docSnap) => mapDocument<Consultation>(docSnap));
}

export async function getConsultationById(id: string): Promise<Consultation | null> {
  const docRef = doc(db, CONSULTATIONS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return mapDocument<Consultation>(docSnap);
}

export async function createConsultation(
  consultation: Omit<Consultation, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();
  const dataToSave = { ...consultation, createdAt: now, updatedAt: now };
  if (!dataToSave.date) {
    dataToSave.date = now.toDate();
  }

  const docRef = await addDoc(collection(db, CONSULTATIONS), dataToSave);
  return docRef.id;
}

export async function updateConsultation(id: string, data: Partial<Consultation>): Promise<void> {
  const docRef = doc(db, CONSULTATIONS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function getTodaysQueue(): Promise<Patient[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const q = query(
    collection(db, PATIENTS),
    where("queueStatus", "in", ["waiting", "in_consultation", "completed", "meds_and_bills"]),
    where("queueAddedAt", ">=", Timestamp.fromDate(today)),
    where("queueAddedAt", "<", Timestamp.fromDate(tomorrow)),
    orderBy("queueAddedAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => serializeQueuePatient(mapDocument<Patient>(docSnap)));
}

export async function addPatientToQueue(patientId: string): Promise<void> {
  const docRef = doc(db, PATIENTS, patientId);
  await updateDoc(docRef, {
    queueStatus: "waiting",
    queueAddedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function removePatientFromQueue(patientId: string): Promise<void> {
  const docRef = doc(db, PATIENTS, patientId);
  await updateDoc(docRef, {
    queueStatus: null,
    queueAddedAt: null,
    updatedAt: Timestamp.now(),
  });
}

export async function getConsultationsWithDetails(statuses: QueueStatus[]): Promise<BillableConsultation[]> {
  try {
    const validStatuses = statuses.filter((status): status is Exclude<QueueStatus, null> => Boolean(status));
    if (validStatuses.length === 0) {
      return [];
    }

    const patientsSnapshot = await getDocs(
      query(collection(db, PATIENTS), where("queueStatus", "in", validStatuses))
    );
    const patientsById = new Map<string, Patient>(
      patientsSnapshot.docs.map((docSnap) => {
        const patient = mapDocument<Patient>(docSnap);
        return [patient.id, patient];
      })
    );

    if (patientsById.size === 0) {
      return [];
    }

    const consultationsSnapshot = await getDocs(collection(db, CONSULTATIONS));

    const consultations = consultationsSnapshot.docs
      .map((docSnap) => mapDocument<Consultation>(docSnap))
      .filter((consultation) => patientsById.has(consultation.patientId))
      .map((consultation) => {
        const patient = patientsById.get(consultation.patientId)!;
        return {
          id: consultation.id,
          patientId: consultation.patientId,
          patientFullName: patient.fullName,
          queueStatus: patient.queueStatus,
          date: safeToISOString(consultation.date) ?? null,
          createdAt: safeToISOString(consultation.createdAt) ?? null,
          updatedAt: safeToISOString(consultation.updatedAt) ?? null,
          type: consultation.type,
          doctor: consultation.doctor,
          chiefComplaint: consultation.chiefComplaint,
          diagnosis: consultation.diagnosis,
          procedures: consultation.procedures,
          notes: consultation.notes,
          prescriptions: consultation.prescriptions,
        } satisfies BillableConsultation;
      });

    return consultations.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error in getConsultationsWithDetails:", error);
    return [];
  }
}

export interface Referral {
  id?: string;
  patientId: string;
  date: Date;
  specialty: string;
  facility: string;
  doctorName?: string;
  urgency?: "routine" | "urgent" | "emergency";
  reason?: string;
  clinicalInfo?: string;
  letterText: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createReferral(referral: Omit<Referral, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const now = Timestamp.now();
  const dataToSave = { ...referral, createdAt: now, updatedAt: now };
  if (!dataToSave.date) {
    dataToSave.date = now.toDate();
  }
  const docRef = await addDoc(collection(db, REFERRALS), dataToSave);
  return docRef.id;
}

export async function getReferralsByPatientId(patientId: string): Promise<Referral[]> {
  const referralQuery = query(collection(db, REFERRALS), where("patientId", "==", patientId));
  const snapshot = await getDocs(referralQuery);
  return snapshot.docs.map((docSnap) => mapDocument<Referral>(docSnap));
}

export async function getReferralById(id: string): Promise<Referral | null> {
  const docRef = doc(db, REFERRALS, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return mapDocument<Referral>(docSnap);
}

export async function updateReferral(id: string, data: Partial<Referral>): Promise<void> {
  const docRef = doc(db, REFERRALS, id);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export interface PatientDocument {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string;
  downloadUrl: string;
  uploadedAt: Date | string;
  uploadedBy?: string | null;
}

export async function getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  const documentsCollection = collection(db, PATIENTS, patientId, PATIENT_DOCUMENTS);
  const snapshot = await getDocs(documentsCollection);
  return snapshot.docs.map((docSnap) => mapDocument<PatientDocument>(docSnap));
}

export async function getAllPatientDocuments(): Promise<(PatientDocument & { patientId: string })[]> {
  const snapshot = await getDocs(collectionGroup(db, PATIENT_DOCUMENTS));
  return snapshot.docs.map((docSnap) => {
    const document = mapDocument<PatientDocument>(docSnap);
    const segments = docSnap.ref.path.split("/");
    const patientId = segments.length >= 2 ? segments[1] : "";
    return { ...document, patientId };
  });
}
