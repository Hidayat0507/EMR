import { db } from './firebase';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { QueueStatus } from './types';
import { z } from 'zod';

const idSchema = z.string().min(1);
const statusSchema = z.enum(['waiting', 'in_consultation', 'completed', 'meds_and_bills']).nullable().or(z.literal('waiting')).or(z.literal('in_consultation')).or(z.literal('completed')).or(z.literal('meds_and_bills')) as any;

export async function addPatientToQueue(patientId: string) {
  try {
    idSchema.parse(patientId);
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Patient not found');
    }

    const patientData = docSnap.data();
    if (patientData.queueStatus === 'waiting' || patientData.queueStatus === 'in_consultation') {
      throw new Error('Patient is already in queue');
    }

    await updateDoc(docRef, {
      queueStatus: 'waiting' as QueueStatus,
      queueAddedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error adding patient to queue:', error);
    throw error;
  }
}

export async function removePatientFromQueue(patientId: string) {
  try {
    idSchema.parse(patientId);
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Patient not found');
    }

    await updateDoc(docRef, {
      queueStatus: null,
      queueAddedAt: null,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error removing patient from queue:', error);
    throw error;
  }
}

export async function updateQueueStatus(patientId: string, status: QueueStatus) {
  try {
    idSchema.parse(patientId);
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Patient not found');
    }

    await updateDoc(docRef, {
      queueStatus: status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
    throw error;
  }
}

export async function getQueueStatus(patientId: string): Promise<QueueStatus> {
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Patient not found');
    }

    return docSnap.data().queueStatus as QueueStatus;
  } catch (error) {
    console.error('Error getting queue status:', error);
    throw error;
  }
} 