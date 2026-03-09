import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  writeBatch 
} from 'firebase/firestore';
export interface Medication {
  id: string;
  name: string;
  category: string;
  dosageForm: string;
  strengths: string[];
  stock: number;
  minimumStock: number;
  unit: string;
  unitPrice: number;
  expiryDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NewMedicationInput = Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>;

const MEDICATIONS = 'medications';
const convertTimestamps = (data: DocumentData) => {
  const result = { ...data };
  if (result.createdAt) {
    result.createdAt = result.createdAt.toDate();
  }
  if (result.updatedAt) {
    result.updatedAt = result.updatedAt.toDate();
  }
  return result;
};

export async function getMedications(): Promise<Medication[]> {
  try {
    const medsCollection = collection(db, MEDICATIONS);
    const snapshot = await getDocs(medsCollection);

    return snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...convertTimestamps(docSnapshot.data()),
    } as Medication));
  } catch (error) {
    console.error('Failed to fetch medications from Firestore:', error);
    return [];
  }
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  try {
    const docRef = doc(db, MEDICATIONS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as Medication;
  } catch (error) {
    console.error('Error fetching medication:', error);
    return null;
  }
}

export async function createMedication(data: NewMedicationInput): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, MEDICATIONS), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating medication:', error);
    return null;
  }
}

export async function updateMedication(id: string, data: Partial<Medication>): Promise<boolean> {
  try {
    const docRef = doc(db, MEDICATIONS, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating medication:', error);
    return false;
  }
}

export async function deleteMedication(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, MEDICATIONS, id));
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    return false;
  }
}

export async function batchCreateMedications(items: NewMedicationInput[]): Promise<{ created: number; failed: number }> {
  if (items.length === 0) {
    return { created: 0, failed: 0 };
  }

  const BATCH_SIZE = 450;
  let created = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const slice = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    slice.forEach((item) => {
      const docRef = doc(collection(db, MEDICATIONS));
      batch.set(docRef, {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    try {
      await batch.commit();
      created += slice.length;
    } catch (error) {
      failed += slice.length;
      console.error('Error creating medication from batch:', error);
    }
  }

  return { created, failed };
}
