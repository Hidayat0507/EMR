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
  DocumentData 
} from 'firebase/firestore';

// Types
export interface Patient {
  id: string;
  fullName: string;
  nric: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  lastVisit?: Date;
  upcomingAppointment?: Date;
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
  createdAt: Date;
  updatedAt?: Date;
}

export interface Consultation {
  id?: string;
  patientId: string;
  date: Date;
  type?: string;
  doctor?: string;
  chiefComplaint: string;
  diagnosis: string;
  procedures: string[];
  notes?: string;
  prescriptions: Prescription[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Prescription {
  medication: {
    id: string;
    name: string;
    strength?: string;
  };
  frequency: string;
  duration: string;
}

// Firebase Collections
const PATIENTS = 'patients';
const CONSULTATIONS = 'consultations';

// Helper function to convert Firestore data to our types
const convertTimestamps = (data: DocumentData) => {
  const result = { ...data };
  const dateFields = [
    'createdAt',
    'updatedAt',
    'date',
    'lastVisit',
    'upcomingAppointment',
    'dateOfBirth'
  ];

  dateFields.forEach(field => {
    if (result[field] && typeof result[field].toDate === 'function') {
      result[field] = result[field].toDate();
    } else if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field]);
    }
  });

  return result;
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
