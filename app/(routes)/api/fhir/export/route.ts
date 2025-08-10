import { NextRequest } from "next/server";
import { getConsultationById, getPatientById } from "@/lib/models";
import { toFhirPatient, toFhirEncounter, toFhirCondition, toFhirMedicationRequest, toFhirServiceRequest } from "@/lib/fhir/mappers";

export async function POST(req: NextRequest) {
  try {
    const { consultationId } = await req.json();
    if (!consultationId) return new Response(JSON.stringify({ error: 'consultationId required' }), { status: 400 });

    const consultation = await getConsultationById(consultationId);
    if (!consultation) return new Response(JSON.stringify({ error: 'Consultation not found' }), { status: 404 });

    const patient = await getPatientById(consultation.patientId);
    if (!patient) return new Response(JSON.stringify({ error: 'Patient not found' }), { status: 404 });

    // Create minimal FHIR resources and link
    const { reference: patientRef } = await toFhirPatient(patient);
    const { reference: encounterRef } = await toFhirEncounter(patientRef, consultation);

    const created: Record<string, any> = { patient: patientRef, encounter: encounterRef };

    if (consultation.diagnosis) {
      created.conditionId = await toFhirCondition(patientRef, encounterRef, consultation.diagnosis);
    }

    if (Array.isArray(consultation.prescriptions)) {
      created.medicationRequestIds = await Promise.all(
        consultation.prescriptions.map(p => toFhirMedicationRequest(patientRef, encounterRef, p))
      );
    }

    if (Array.isArray(consultation.procedures)) {
      created.serviceRequestIds = await Promise.all(
        consultation.procedures.map(pr => toFhirServiceRequest(patientRef, encounterRef, pr))
      );
    }

    return new Response(JSON.stringify({ ok: true, created }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 });
  }
}


