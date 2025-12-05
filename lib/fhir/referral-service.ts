/**
 * Referral Service - Medplum FHIR as Source of Truth
 * Uses ServiceRequest resource for referrals
 */

import { MedplumClient } from '@medplum/core';
import type { ServiceRequest } from '@medplum/fhirtypes';

export interface ReferralData {
  patientId: string;
  specialty: string;
  facility: string;
  department?: string;
  doctorName?: string;
  urgency?: 'routine' | 'urgent' | 'stat' | 'asap';
  reason?: string;
  clinicalInfo?: string;
  date?: Date | string;
}

export interface SavedReferral extends ReferralData {
  id: string;
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  createdAt: Date;
}

async function getMedplumClient(): Promise<MedplumClient> {
  const baseUrl = process.env.MEDPLUM_BASE_URL || process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Medplum credentials not configured');
  }

  const medplum = new MedplumClient({ baseUrl, clientId, clientSecret });
  await medplum.startClientLogin(clientId, clientSecret);
  return medplum;
}

/**
 * Save referral to Medplum as ServiceRequest
 */
export async function saveReferralToMedplum(referralData: ReferralData): Promise<string> {
  const medplum = await getMedplumClient();
  
  const serviceRequest: ServiceRequest = {
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: referralData.urgency,
    subject: {
      reference: `Patient/${referralData.patientId}`,
    },
    code: {
      text: `Referral to ${referralData.specialty}`,
    },
    reasonCode: referralData.reason ? [{ text: referralData.reason }] : undefined,
    note: referralData.clinicalInfo ? [{ text: referralData.clinicalInfo }] : undefined,
    performer: [
      {
        display: `${referralData.facility}${referralData.department ? ' - ' + referralData.department : ''}`,
      },
    ],
    requester: referralData.doctorName ? {
      display: referralData.doctorName,
    } : undefined,
    authoredOn: referralData.date 
      ? (typeof referralData.date === 'string' ? referralData.date : referralData.date.toISOString())
      : new Date().toISOString(),
  };

  const saved = await medplum.createResource(serviceRequest);
  console.log(`✅ Created FHIR ServiceRequest (Referral): ${saved.id}`);
  
  return saved.id!;
}

/**
 * Get referral from Medplum
 */
export async function getReferralFromMedplum(referralId: string): Promise<SavedReferral | null> {
  try {
    const medplum = await getMedplumClient();
    const serviceRequest = await medplum.readResource('ServiceRequest', referralId);
    
    const performerDisplay = serviceRequest.performer?.[0]?.display || '';
    const [facility, department] = performerDisplay.split(' - ');

    return {
      id: serviceRequest.id!,
      patientId: serviceRequest.subject?.reference?.replace('Patient/', '') || '',
      specialty: serviceRequest.code?.text || '',
      facility: facility || '',
      department,
      doctorName: serviceRequest.requester?.display,
      urgency: serviceRequest.priority as any,
      reason: serviceRequest.reasonCode?.[0]?.text,
      clinicalInfo: serviceRequest.note?.[0]?.text,
      date: serviceRequest.authoredOn ? new Date(serviceRequest.authoredOn) : new Date(),
      status: serviceRequest.status as any,
      createdAt: serviceRequest.meta?.lastUpdated ? new Date(serviceRequest.meta.lastUpdated) : new Date(),
    };
  } catch (error) {
    console.error('Failed to get referral from Medplum:', error);
    return null;
  }
}

/**
 * Get patient referrals from Medplum
 */
export async function getPatientReferralsFromMedplum(patientId: string): Promise<SavedReferral[]> {
  try {
    const medplum = await getMedplumClient();
    
    const serviceRequests = await medplum.searchResources('ServiceRequest', {
      subject: `Patient/${patientId}`,
      _sort: '-authored',
    });

    const mapped = await Promise.all(
      serviceRequests.map(async (sr) => {
        const saved = await getReferralFromMedplum(sr.id!);
        return saved;
      })
    );

    return mapped.filter((r): r is SavedReferral => r !== null);
  } catch (error) {
    console.error('Failed to get patient referrals from Medplum:', error);
    return [];
  }
}








