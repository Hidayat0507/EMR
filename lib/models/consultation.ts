import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
// Removed import Medication - Check if used elsewhere or needs replacement
// import { Medication } from '@/lib/inventory'; 
import { Consultation, Prescription } from '@/lib/models'; // Import canonical types

// Removed local Prescription interface definition
/*
export interface Prescription {
  medication: {
    id: string;
    name: string;
    strength?: string;
  };
  frequency: string;
  duration: string;
}
*/

// Removed local Consultation interface definition
/*
export interface Consultation {
  id?: string;
  patientId: string;
  chiefComplaint: string;
  diagnosis: string;
  procedures: string[];
  additionalNotes?: string;
  prescriptions: Prescription[];
  createdAt?: Date;
  updatedAt?: Date;
}
*/

const CONSULTATIONS = 'consultations';

// Convert Firestore timestamps to Date (This helper might be redundant if the one in models.ts is used)
// Consider removing this or ensuring consistency
const convertTimestamps = (data: DocumentData) => {
  const result = { ...data };
  if (result.createdAt) {
    result.createdAt = result.createdAt.toDate();
  }
  if (result.updatedAt) {
    result.updatedAt = result.updatedAt.toDate();
  }
  // Add conversion for 'date' if it exists and needed here
  // if (result.date) { result.date = result.date.toDate(); }
  return result;
};

// createConsultation function might be moved entirely to models.ts
// If kept here, ensure it uses the imported types correctly
/*
export async function createConsultation(consultation: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, CONSULTATIONS), {
      ...consultation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating consultation:', error);
    return null;
  }
}
*/

// Ensure other functions use the imported Consultation type
export async function getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
  try {
    const q = query(collection(db, CONSULTATIONS), where('patientId', '==', patientId));
    const querySnapshot = await getDocs(q);
    
    // Make sure the mapping uses the imported Consultation type and potentially the helper from models.ts
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()) // Uses local convertTimestamps
    } as Consultation));
  } catch (error) {
    console.error('Error fetching patient consultations:', error);
    return [];
  }
}

export async function getConsultationById(id: string): Promise<Consultation | null> {
  try {
    const docRef = doc(db, CONSULTATIONS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    // Make sure the mapping uses the imported Consultation type and potentially the helper from models.ts
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()) // Uses local convertTimestamps
    } as Consultation;
  } catch (error) {
    console.error('Error fetching consultation:', error);
    return null;
  }
}

export async function updateConsultation(id: string, consultation: Partial<Consultation>): Promise<boolean> {
  try {
    const docRef = doc(db, CONSULTATIONS, id);
    await updateDoc(docRef, {
      ...consultation,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating consultation:', error);
    return false;
  }
}

export async function deleteConsultation(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, CONSULTATIONS, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting consultation:', error);
    return false;
  }
}
