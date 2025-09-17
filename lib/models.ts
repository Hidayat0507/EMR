import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  DocumentData,
  orderBy
} from 'firebase/firestore';
import { safeToISOString } from './utils';
// Import needed types
import { QueueStatus, BillableConsultation } from './types';
import { collectionGroup } from 'firebase/firestore';

// Types
export interface Patient {
  id: string;
  fullName: string;
  nric: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female' | 'other';
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
  queueStatus?: QueueStatus; // allow null per shared QueueStatus type
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

// Define type for procedures stored in consultation
export interface ProcedureRecord {
  name: string;
  price?: number;
  // Add other fields if needed, e.g., notes specific to this procedure instance
  notes?: string;
  // Link to master procedure and FHIR coding for interoperable export
  procedureId?: string;
  codingSystem?: string; // e.g., http://snomed.info/sct
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
  price?: number; // Add optional price field
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

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

// Firebase Collections
const PATIENTS = 'patients';
const CONSULTATIONS = 'consultations';
const REFERRALS = 'referrals';
const APPOINTMENTS = 'appointments';
// Subcollections
const PATIENT_DOCUMENTS = 'documents';

// Helper function to convert Firestore data to our types
const convertTimestamps = (data: DocumentData): DocumentData => {
  try {
    const result = { ...data };
    const dateFields = [
      'createdAt',
      'updatedAt',
      'date',
      'lastVisit',
      'upcomingAppointment',
      'dateOfBirth',
      'queueAddedAt',
      'scheduledAt',
      'checkInTime',
      'completedAt',
      'cancelledAt'
    ];

    dateFields.forEach(field => {
      if (result[field]) {
        if (typeof result[field].toDate === 'function') {
          try {
            result[field] = result[field].toDate();
          } catch (e) {
            console.error(`Error converting ${field} to date:`, e);
            result[field] = null;
          }
        } else if (typeof result[field] === 'string') {
          try {
            const date = new Date(result[field]);
            if (!isNaN(date.getTime())) {
              result[field] = date;
            } else {
              result[field] = null;
            }
          } catch (e) {
            console.error(`Error parsing ${field} string to date:`, e);
            result[field] = null;
          }
        } else {
          result[field] = null;
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error in convertTimestamps:', error);
    return data;
  }
};

// Patient functions
export async function getPatients(): Promise<Patient[]> {
  const snapshot = await getDocs(collection(db, PATIENTS));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Patient));
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const docRef = doc(db, PATIENTS, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  } as Patient;
}

export async function createPatient(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, PATIENTS), {
    ...data,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
}

export async function getAppointments(statuses?: AppointmentStatus[]): Promise<Appointment[]> {
  const appointmentsQuery = query(collection(db, APPOINTMENTS), orderBy('scheduledAt', 'asc'));
  const snapshot = await getDocs(appointmentsQuery);
  const appointments = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  } as Appointment));

  if (statuses && statuses.length > 0) {
    return appointments.filter(appointment => appointment.status && statuses.includes(appointment.status));
  }

  return appointments;
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const docRef = doc(db, APPOINTMENTS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  } as Appointment;
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
  const scheduledDate = appointment.scheduledAt instanceof Date
    ? appointment.scheduledAt
    : new Date(appointment.scheduledAt);

  if (isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduledAt date provided for appointment.');
  }

  const scheduledTimestamp = Timestamp.fromDate(scheduledDate);

  const payload: Record<string, unknown> = {
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    patientContact: appointment.patientContact ?? '',
    clinician: appointment.clinician,
    reason: appointment.reason,
    type: appointment.type ?? '',
    location: appointment.location ?? '',
    notes: appointment.notes ?? '',
    durationMinutes: appointment.durationMinutes ?? null,
    status: appointment.status ?? 'scheduled',
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
    console.error('Failed to update patient upcoming appointment after scheduling:', error);
  }

  return docRef.id;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  const docRef = doc(db, APPOINTMENTS, id);
  const updatePayload: Record<string, unknown> = {};

  const dateFields: Array<keyof Appointment> = ['scheduledAt', 'checkInTime', 'completedAt', 'cancelledAt'];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;

    if (dateFields.includes(key as keyof Appointment)) {
      if (value === null) {
        updatePayload[key] = null;
        continue;
      }

      const dateValue = value instanceof Date ? value : new Date(value as string);
      if (isNaN(dateValue.getTime())) {
        console.warn(`Skipping invalid date field ${key} when updating appointment ${id}`);
        continue;
      }
      updatePayload[key] = Timestamp.fromDate(dateValue);
    } else if (key !== 'id' && key !== 'createdAt') {
      updatePayload[key] = value;
    }
  }

  updatePayload.updatedAt = Timestamp.now();

  await updateDoc(docRef, updatePayload as { [x: string]: any });
}

// Consultation functions
export async function getConsultationsByPatientId(patientId: string): Promise<Consultation[]> {
  const q = query(
    collection(db, CONSULTATIONS),
    where("patientId", "==", patientId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as Consultation));
}

export async function getConsultationById(id: string): Promise<Consultation | null> {
  const docRef = doc(db, CONSULTATIONS, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  } as Consultation;
}

export async function createConsultation(consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const dataToSave = { ...consultation, createdAt: now, updatedAt: now };
  if (!dataToSave.date) dataToSave.date = now.toDate();

  const docRef = await addDoc(collection(db, CONSULTATIONS), dataToSave);
  return docRef.id;
}

export async function updateConsultation(id: string, data: Partial<Consultation>): Promise<void> {
  const docRef = doc(db, CONSULTATIONS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
}

export async function getTodaysQueue(): Promise<Patient[]> {
  // Calculate the start and end of the current day for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Convert to Firestore Timestamps for the query
  const todayTimestamp = Timestamp.fromDate(today);
  const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

  // Query for patients with an active status added today
  const q = query(
    collection(db, PATIENTS),
    where("queueStatus", "in", ["waiting", "in_consultation", "completed", "meds_and_bills"]),
    where("queueAddedAt", ">=", todayTimestamp), // Added today condition
    where("queueAddedAt", "<", tomorrowTimestamp), // Added today condition
    orderBy("queueAddedAt", "asc") // Order by when they were added
  );

  const querySnapshot = await getDocs(q);

  // Map the documents directly from the new query result
  const patientsInQueue = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data()) // Still convert timestamps for the client
  } as Patient));

  // Convert Timestamps to ISO strings before returning, as the client components might expect this format
  return patientsInQueue.map(patient => ({
    ...patient,
    // Ensure all relevant date/timestamp fields are converted using the imported helper
    createdAt: patient.createdAt instanceof Date ? patient.createdAt.toISOString() : safeToISOString(patient.createdAt),
    updatedAt: patient.updatedAt instanceof Date ? patient.updatedAt.toISOString() : safeToISOString(patient.updatedAt),
    queueAddedAt: patient.queueAddedAt instanceof Date ? patient.queueAddedAt.toISOString() : safeToISOString(patient.queueAddedAt),
    dateOfBirth: patient.dateOfBirth instanceof Date ? patient.dateOfBirth.toISOString() : safeToISOString(patient.dateOfBirth),
    lastVisit: patient.lastVisit instanceof Date ? patient.lastVisit.toISOString() : safeToISOString(patient.lastVisit),
    upcomingAppointment: patient.upcomingAppointment instanceof Date ? patient.upcomingAppointment.toISOString() : safeToISOString(patient.upcomingAppointment),
  })) as Patient[]; // Cast might need adjustment based on Patient type def
}

export async function addPatientToQueue(patientId: string): Promise<void> {
  const docRef = doc(db, PATIENTS, patientId);
  await updateDoc(docRef, {
    queueStatus: 'waiting',
    queueAddedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
}

export async function removePatientFromQueue(patientId: string): Promise<void> {
  const docRef = doc(db, PATIENTS, patientId);
  await updateDoc(docRef, {
    queueStatus: null,
    queueAddedAt: null,
    updatedAt: Timestamp.now()
  });
}

// Function to fetch consultations by status and include patient details
export async function getConsultationsWithDetails(statuses: QueueStatus[]): Promise<BillableConsultation[]> {
  try {
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
      return [];
    }

    // 1. Fetch Patients with relevant statuses
    const patientsRef = collection(db, PATIENTS);
    const validStatuses = statuses.filter(status => status !== null);
    const patientsQuery = query(patientsRef, where('queueStatus', 'in', validStatuses));
    const patientSnapshots = await getDocs(patientsQuery);
    const relevantPatients = new Map<string, Patient>();
    
    patientSnapshots.forEach(doc => {
      const data = doc.data();
      if (data) {
        relevantPatients.set(doc.id, { 
          id: doc.id, 
          ...convertTimestamps(data) 
        } as Patient);
      }
    });

    if (relevantPatients.size === 0) {
      return [];
    }

    // 2. Fetch all consultations
    const allConsultationsRef = collection(db, 'consultations');
    const allConsultationsSnap = await getDocs(allConsultationsRef);
    const billableConsultations: BillableConsultation[] = [];

    allConsultationsSnap.forEach(doc => {
      const data = doc.data();
      if (data) {
        const consultationData = { 
          id: doc.id, 
          ...convertTimestamps(data) 
        } as Consultation;
        
        const patientData = relevantPatients.get(consultationData.patientId);

        if (patientData) {
          const billableEntry = {
            id: consultationData.id,
            patientId: consultationData.patientId,
            patientFullName: patientData.fullName,
            queueStatus: patientData.queueStatus,
            date: safeToISOString(consultationData.date),
            createdAt: safeToISOString(consultationData.createdAt),
            updatedAt: safeToISOString(consultationData.updatedAt),
            type: consultationData.type || null,
            doctor: consultationData.doctor || null,
            chiefComplaint: consultationData.chiefComplaint,
            diagnosis: consultationData.diagnosis,
            procedures: consultationData.procedures || [],
            notes: consultationData.notes || null,
            prescriptions: consultationData.prescriptions || [],
          } as BillableConsultation;

          billableConsultations.push(billableEntry);
        }
      }
    });

    // Sort results by date
    return billableConsultations.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error in getConsultationsWithDetails:', error);
    return [];
  }
}

// --- Referral Letters ---

export interface Referral {
  id?: string;
  patientId: string;
  date: Date;
  specialty: string;
  facility: string;
  doctorName?: string;
  urgency?: 'routine' | 'urgent' | 'emergency';
  reason?: string;
  clinicalInfo?: string;
  letterText: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createReferral(referral: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const dataToSave = { ...referral, createdAt: now, updatedAt: now };
  if (!dataToSave.date) dataToSave.date = now.toDate();
  const docRef = await addDoc(collection(db, REFERRALS), dataToSave);
  return docRef.id;
}

export async function getReferralsByPatientId(patientId: string): Promise<Referral[]> {
  const q = query(collection(db, REFERRALS), where('patientId', '==', patientId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as Referral));
}

export async function getReferralById(id: string): Promise<Referral | null> {
  const docRef = doc(db, REFERRALS, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Referral;
}

export async function updateReferral(id: string, data: Partial<Referral>): Promise<void> {
  const docRef = doc(db, REFERRALS, id);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

// --- FHIR Integration --- REMOVED

// --- Patient Documents ---

export interface PatientDocument {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  storagePath: string; // path in Firebase Storage
  downloadUrl: string; // signed URL for viewing
  uploadedAt: Date | string;
  uploadedBy?: string | null; // uid or email if you track it
}

// List documents for a patient (subcollection: patients/{id}/documents)
export async function getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  const col = collection(db, PATIENTS, patientId, PATIENT_DOCUMENTS);
  const snap = await getDocs(col);
  return snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) } as PatientDocument));
}

// Optionally: list all documents across patients (collection group query)
export async function getAllPatientDocuments(): Promise<(PatientDocument & { patientId: string })[]> {
  const cg = collectionGroup(db, PATIENT_DOCUMENTS);
  const snap = await getDocs(cg);
  return snap.docs.map(d => {
    // Extract patientId from the path: patients/{patientId}/documents/{docId}
    const segments = d.ref.path.split('/');
    const patientId = segments.length >= 2 ? segments[1] : '';
    return { id: d.id, patientId, ...convertTimestamps(d.data()) } as PatientDocument & { patientId: string };
  });
}
