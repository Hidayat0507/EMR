import { Patient as AppPatient, Consultation, Prescription, ProcedureRecord } from "@/lib/models";
import { saveFhirResource } from "./firestore";

export async function toFhirPatient(app: AppPatient): Promise<{ reference: string; id: string }> {
  const resource = {
    resourceType: "Patient",
    identifier: [
      app.nric ? { system: "https://yourdomain/id/nric", value: app.nric } : undefined,
    ].filter(Boolean),
    name: [{ text: app.fullName }],
    gender: app.gender,
    birthDate: typeof app.dateOfBirth === 'string' ? app.dateOfBirth.substring(0, 10) : undefined,
    telecom: app.phone ? [{ system: 'phone', value: app.phone }] : [],
  } as any;
  const id = await saveFhirResource(resource);
  return { reference: `Patient/${id}`, id };
}

export async function toFhirEncounter(patientRef: string, consult: Consultation): Promise<{ reference: string; id: string }> {
  const resource = {
    resourceType: "Encounter",
    status: "finished",
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB" },
    subject: { reference: patientRef },
    period: { start: new Date(consult.date).toISOString() },
  } as any;
  const id = await saveFhirResource(resource);
  return { reference: `Encounter/${id}`, id };
}

export async function toFhirCondition(patientRef: string, encounterRef: string, diagnosis: string): Promise<string> {
  const resource = {
    resourceType: "Condition",
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    code: { text: diagnosis },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
  } as any;
  const id = await saveFhirResource(resource);
  return id;
}

export async function toFhirMedicationRequest(patientRef: string, encounterRef: string, p: Prescription): Promise<string> {
  const freqMap: Record<string, number> = { od: 1, bd: 2, tds: 3, qid: 4 };
  const frequency = p.frequency ? freqMap[(p.frequency as string).toLowerCase()] : undefined;
  const resource = {
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    medicationCodeableConcept: { text: p.medication.name },
    authoredOn: new Date().toISOString(),
    dosageInstruction: frequency ? [{ timing: { repeat: { frequency, period: 1, periodUnit: 'd' } } }] : undefined,
  } as any;
  const id = await saveFhirResource(resource);
  return id;
}

export async function toFhirServiceRequest(patientRef: string, encounterRef: string, pr: ProcedureRecord): Promise<string> {
  const resource = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    code: { text: pr.name },
    note: pr.notes ? [{ text: pr.notes }] : undefined,
  } as any;
  const id = await saveFhirResource(resource);
  return id;
}


