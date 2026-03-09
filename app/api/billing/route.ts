import { NextRequest, NextResponse } from "next/server";
import { getClinicIdFromRequest } from "@/lib/server/clinic";
import { requireAuth } from "@/lib/server/medplum-auth";
import {
  upsertInvoiceForEncounter,
  getInvoiceForEncounter,
  getInvoiceById,
  mapInvoiceToBillPayload,
} from "@/lib/fhir/invoice-service";
import { getPatientFromMedplum } from "@/lib/fhir/patient-service";
import { getConsultationById } from "@/lib/models";

function resolveClinicId(clinicId: string | null): string | null {
  if (clinicId) return clinicId;
  if (process.env.NODE_ENV !== "production") {
    const fallback = process.env.NEXT_PUBLIC_DEFAULT_CLINIC_ID || "default";
    console.warn("⚠️  No clinicId found, using default for development:", fallback);
    return fallback;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const clinicId = resolveClinicId(await getClinicIdFromRequest(request));
    if (!clinicId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing clinicId. Please set NEXT_PUBLIC_DEFAULT_CLINIC_ID for development or access via clinic subdomain.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { encounterId, patientId, procedures = [], prescriptions = [], encounterDate } = body ?? {};

    if (!encounterId || !patientId) {
      return NextResponse.json(
        { success: false, error: "encounterId and patientId are required" },
        { status: 400 }
      );
    }

    const invoice = await upsertInvoiceForEncounter({
      encounterId,
      patientId,
      clinicId,
      procedures,
      prescriptions,
      encounterDate,
    });

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
    });
  } catch (error: any) {
    console.error("❌ Failed to save invoice:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save invoice" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const encounterId = searchParams.get("encounterId");
    const invoiceId = searchParams.get("invoiceId");

    if (!encounterId && !invoiceId) {
      return NextResponse.json(
        { success: false, error: "encounterId or invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = invoiceId
      ? await getInvoiceById(invoiceId)
      : await getInvoiceForEncounter(encounterId!);

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const fallbackConsultation =
      encounterId || invoice.identifier?.[0]?.value
        ? await getConsultationById(encounterId || invoice.identifier?.[0]?.value || "")
        : null;

    const patientId =
      invoice.subject?.reference?.replace("Patient/", "") ||
      fallbackConsultation?.patientId ||
      null;
    const patient = patientId ? await getPatientFromMedplum(patientId) : null;
    const patientName =
      (patient as any)?.fullName ||
      (patient as any)?.name ||
      (fallbackConsultation as any)?.patientFullName ||
      fallbackConsultation?.patientId ||
      "Patient";

    const bill = mapInvoiceToBillPayload(invoice, {
      patientName,
      fallbackDate: fallbackConsultation?.date ?? invoice.date,
    });

    return NextResponse.json({
      success: true,
      invoice,
      bill,
    });
  } catch (error: any) {
    console.error("❌ Failed to load invoice:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load invoice" },
      { status: 500 }
    );
  }
}
