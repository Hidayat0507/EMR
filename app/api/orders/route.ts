import { NextRequest, NextResponse } from 'next/server';
import { getConsultationById } from '@/lib/models';
import { getPatientFromMedplum } from '@/lib/fhir/patient-service';
import { getInvoiceForEncounter, mapInvoiceToBillPayload } from '@/lib/fhir/invoice-service';
import { requireAuth } from '@/lib/server/medplum-auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const consultationId = searchParams.get('consultationId');
    const patientId = searchParams.get('patientId');

    if (!consultationId || !patientId) {
      return NextResponse.json({ success: false, error: 'consultationId and patientId are required' }, { status: 400 });
    }

    const [patient, consultation] = await Promise.all([
      getPatientFromMedplum(patientId),
      getConsultationById(consultationId),
    ]);

    if (!patient || !consultation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const invoice = consultation?.id ? await getInvoiceForEncounter(consultation.id) : null;
    const bill = invoice
      ? mapInvoiceToBillPayload(invoice, {
          patientName:
            (patient as any)?.fullName ||
            (patient as any)?.name ||
            (consultation as any)?.patientFullName ||
            "Patient",
          fallbackDate: (consultation as any)?.date,
        })
      : null;

    return NextResponse.json({ success: true, patient, consultation, bill });
  } catch (error: any) {
    console.error('[orders] Failed to load details:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to load details' }, { status: 500 });
  }
}
