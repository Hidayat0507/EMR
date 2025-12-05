/**
 * PACS Module Database Functions
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
import type { ImagingStudy } from "./types";

const IMAGING_COLLECTION = "imaging_studies";

export async function createImagingStudy(
  studyData: Omit<ImagingStudy, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();
  
  const docRef = await addDoc(collection(db, IMAGING_COLLECTION), {
    ...studyData,
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
}

export async function getImagingStudyById(id: string): Promise<ImagingStudy | null> {
  const docRef = doc(db, IMAGING_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as ImagingStudy;
}

export async function getImagingStudiesByPatient(patientId: string): Promise<ImagingStudy[]> {
  const q = query(
    collection(db, IMAGING_COLLECTION),
    where("patientId", "==", patientId),
    orderBy("orderedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as ImagingStudy));
}

export async function getImagingStudiesByStatus(status: ImagingStudy['status']): Promise<ImagingStudy[]> {
  const q = query(
    collection(db, IMAGING_COLLECTION),
    where("status", "==", status),
    orderBy("orderedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as ImagingStudy));
}

export async function getTodaysImagingStudies(): Promise<ImagingStudy[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const q = query(
    collection(db, IMAGING_COLLECTION),
    where("orderedAt", ">=", Timestamp.fromDate(today)),
    where("orderedAt", "<", Timestamp.fromDate(tomorrow)),
    orderBy("orderedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as ImagingStudy));
}

export async function updateImagingStudy(
  id: string,
  updates: Partial<ImagingStudy>
): Promise<void> {
  const docRef = doc(db, IMAGING_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function addImagingReport(
  id: string,
  report: ImagingStudy['report'],
  reportedBy: string
): Promise<void> {
  const docRef = doc(db, IMAGING_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'reported',
    report,
    reportedBy,
    reportedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}








