/**
 * POCT Module Database Functions
 */

import { db } from "@/lib/firebase";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
} from "firebase/firestore";
import type { POCTTest } from "./types";

const POCT_COLLECTION = "poct_tests";

export async function createPOCTTest(
  testData: Omit<POCTTest, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();
  
  const docRef = await addDoc(collection(db, POCT_COLLECTION), {
    ...testData,
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
}

export async function getPOCTTestById(id: string): Promise<POCTTest | null> {
  const docRef = doc(db, POCT_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as POCTTest;
}

export async function getPOCTTestsByPatient(patientId: string): Promise<POCTTest[]> {
  const q = query(
    collection(db, POCT_COLLECTION),
    where("patientId", "==", patientId),
    orderBy("orderedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as POCTTest));
}

export async function getPOCTTestsByStatus(status: POCTTest['status']): Promise<POCTTest[]> {
  const q = query(
    collection(db, POCT_COLLECTION),
    where("status", "==", status),
    orderBy("orderedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as POCTTest));
}

export async function getTodaysPOCTTests(): Promise<POCTTest[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const q = query(
    collection(db, POCT_COLLECTION),
    where("orderedAt", ">=", Timestamp.fromDate(today)),
    where("orderedAt", "<", Timestamp.fromDate(tomorrow)),
    orderBy("orderedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as POCTTest));
}

export async function updatePOCTTest(
  id: string,
  updates: Partial<POCTTest>
): Promise<void> {
  const docRef = doc(db, POCT_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function completePOCTTest(
  id: string,
  result: POCTTest['result'],
  performedBy: string
): Promise<void> {
  const docRef = doc(db, POCT_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'completed',
    result,
    performedBy,
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}








