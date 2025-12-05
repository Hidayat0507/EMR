/**
 * Appointment Service - Medplum FHIR as Source of Truth
 */

import { MedplumClient } from '@medplum/core';
import type { Appointment as FHIRAppointment } from '@medplum/fhirtypes';

export interface AppointmentData {
  patientId: string;
  patientName: string;
  patientContact?: string;
  clinician: string;
  reason: string;
  type?: string;
  location?: string;
  notes?: string;
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  scheduledAt: Date | string;
  durationMinutes?: number;
}

export interface SavedAppointment extends AppointmentData {
  id: string;
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
 * Save appointment to Medplum
 */
export async function saveAppointmentToMedplum(appointmentData: AppointmentData): Promise<string> {
  const medplum = await getMedplumClient();
  
  const scheduledTime = typeof appointmentData.scheduledAt === 'string' 
    ? appointmentData.scheduledAt 
    : appointmentData.scheduledAt.toISOString();

  const endTime = new Date(scheduledTime);
  if (appointmentData.durationMinutes) {
    endTime.setMinutes(endTime.getMinutes() + appointmentData.durationMinutes);
  } else {
    endTime.setMinutes(endTime.getMinutes() + 30); // Default 30 min
  }

  const fhirAppointment: FHIRAppointment = {
    resourceType: 'Appointment',
    status: appointmentData.status,
    start: scheduledTime,
    end: endTime.toISOString(),
    minutesDuration: appointmentData.durationMinutes || 30,
    participant: [
      {
        actor: {
          reference: `Patient/${appointmentData.patientId}`,
          display: appointmentData.patientName,
        },
        status: 'accepted',
      },
      {
        actor: {
          display: appointmentData.clinician,
        },
        status: 'accepted',
      },
    ],
    reasonCode: appointmentData.reason ? [{ text: appointmentData.reason }] : undefined,
    appointmentType: appointmentData.type ? { text: appointmentData.type } : undefined,
    comment: appointmentData.notes,
  };

  const saved = await medplum.createResource(fhirAppointment);
  console.log(`✅ Created FHIR Appointment: ${saved.id}`);
  
  return saved.id!;
}

/**
 * Get appointment from Medplum
 */
export async function getAppointmentFromMedplum(appointmentId: string): Promise<SavedAppointment | null> {
  try {
    const medplum = await getMedplumClient();
    const fhirAppt = await medplum.readResource('Appointment', appointmentId);
    
    const patientParticipant = fhirAppt.participant?.find(p => p.actor?.reference?.startsWith('Patient/'));
    const clinicianParticipant = fhirAppt.participant?.find(p => !p.actor?.reference?.startsWith('Patient/'));

    return {
      id: fhirAppt.id!,
      patientId: patientParticipant?.actor?.reference?.replace('Patient/', '') || '',
      patientName: patientParticipant?.actor?.display || '',
      clinician: clinicianParticipant?.actor?.display || '',
      reason: fhirAppt.reasonCode?.[0]?.text || '',
      type: fhirAppt.appointmentType?.text,
      notes: fhirAppt.comment,
      status: fhirAppt.status as any,
      scheduledAt: fhirAppt.start ? new Date(fhirAppt.start) : new Date(),
      durationMinutes: fhirAppt.minutesDuration,
      createdAt: fhirAppt.meta?.lastUpdated ? new Date(fhirAppt.meta.lastUpdated) : new Date(),
    };
  } catch (error) {
    console.error('Failed to get appointment from Medplum:', error);
    return null;
  }
}

/**
 * Get patient appointments from Medplum
 */
export async function getPatientAppointmentsFromMedplum(patientId: string): Promise<SavedAppointment[]> {
  try {
    const medplum = await getMedplumClient();
    
    const appointments = await medplum.searchResources('Appointment', {
      actor: `Patient/${patientId}`,
      _sort: '-date',
    });

    const mapped = await Promise.all(
      appointments.map(async (appt) => {
        const saved = await getAppointmentFromMedplum(appt.id!);
        return saved;
      })
    );

    return mapped.filter((a): a is SavedAppointment => a !== null);
  } catch (error) {
    console.error('Failed to get patient appointments from Medplum:', error);
    return [];
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow'
): Promise<void> {
  const medplum = await getMedplumClient();
  
  const appointment = await medplum.readResource('Appointment', appointmentId);
  await medplum.updateResource({
    ...appointment,
    status,
  });
  
  console.log(`✅ Updated Appointment ${appointmentId} status to ${status}`);
}








