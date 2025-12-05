import type { Consultation, Patient } from "@/lib/models";
import { getPatientFromMedplum } from "@/lib/fhir/patient-service";
import { getPatientConsultationsFromMedplum } from "@/lib/fhir/consultation-service";

export async function getPatientByIdAdmin(id: string): Promise<Patient | null> {
  const patient = await getPatientFromMedplum(id);
  return (patient as unknown as Patient) ?? null;
}

export async function getConsultationsByPatientIdAdmin(patientId: string): Promise<Consultation[]> {
  const consultations = await getPatientConsultationsFromMedplum(patientId);
  return consultations as unknown as Consultation[];
}
