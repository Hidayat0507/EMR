import { db } from './firebase';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { QueueStatus } from './types';

export async function addPatientToQueue(patientId: string) {
  try {
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