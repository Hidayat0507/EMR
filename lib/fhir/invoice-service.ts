/**
 * Billing/Invoice Service - Medplum FHIR as Source of Truth
 */

import type { Invoice, InvoiceLineItem, InvoiceLineItemPriceComponent } from "@medplum/fhirtypes";
import { getMedplumClient } from "./patient-service";
import type { ProcedureRecord, Prescription } from "@/lib/models";
import { formatDisplayDate } from "@/lib/utils";

export interface InvoiceInput {
  encounterId: string;
  patientId: string;
  clinicId: string;
  procedures?: ProcedureRecord[];
  prescriptions?: Prescription[];
  encounterDate?: string | Date;
}

export interface BillPayload {
  id: string;
  patientName: string;
  date: string;
  prescriptions: Array<{ name: string; dosage: string; price: number }>;
  procedures: Array<{ name: string; description: string; price: number }>;
}

const PRICE_CURRENCY = "MYR";
const ENCOUNTER_IDENTIFIER_SYSTEM = "https://ucc.emr/invoice/encounter";
const LINE_TYPE_EXTENSION_URL = "https://ucc.emr/billing/line-type";
const LINE_NOTE_EXTENSION_URL = "https://ucc.emr/billing/line-note";

type LineType = "procedure" | "prescription";

function priceComponent(amount?: number): InvoiceLineItemPriceComponent[] | undefined {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return undefined;
  }
  return [
    {
      type: "base",
      amount: {
        value: amount,
        currency: PRICE_CURRENCY,
      },
    },
  ];
}

function formatPrescriptionDosage(prescription: Prescription): string {
  const parts = [
    prescription.medication?.strength,
    prescription.frequency,
    prescription.duration,
  ].filter(Boolean);
  return parts.join(" · ");
}

function buildProcedureLine(procedure: ProcedureRecord, sequence: number): InvoiceLineItem {
  const coding =
    procedure.codingSystem || procedure.codingCode || procedure.codingDisplay
      ? [
          {
            system: procedure.codingSystem,
            code: procedure.codingCode,
            display: procedure.codingDisplay ?? procedure.name,
          },
        ]
      : undefined;

  return {
    sequence,
    chargeItemCodeableConcept: {
      text: procedure.name,
      coding,
    },
    priceComponent: priceComponent(procedure.price),
    extension: [
      { url: LINE_TYPE_EXTENSION_URL, valueCode: "procedure" },
      ...(procedure.notes
        ? [{ url: LINE_NOTE_EXTENSION_URL, valueString: procedure.notes }] as const
        : []),
    ],
  };
}

function buildPrescriptionLine(prescription: Prescription, sequence: number): InvoiceLineItem {
  const dosage = formatPrescriptionDosage(prescription);
  const label = prescription.medication?.name ?? "Medication";

  const coding = prescription.medication?.id
    ? [
        {
          system: "https://ucc.emr/medication",
          code: prescription.medication.id,
          display: label,
        },
      ]
    : undefined;

  return {
    sequence,
    chargeItemCodeableConcept: {
      text: label,
      coding,
    },
    priceComponent: priceComponent(prescription.price),
    extension: [
      { url: LINE_TYPE_EXTENSION_URL, valueCode: "prescription" },
      ...(dosage
        ? [{ url: LINE_NOTE_EXTENSION_URL, valueString: dosage }] as const
        : []),
    ],
  };
}

function buildLineItems(
  procedures: ProcedureRecord[] = [],
  prescriptions: Prescription[] = []
): InvoiceLineItem[] {
  const lines: InvoiceLineItem[] = [];
  procedures.forEach((proc) => {
    lines.push(buildProcedureLine(proc, lines.length + 1));
  });
  prescriptions.forEach((prescription) => {
    lines.push(buildPrescriptionLine(prescription, lines.length + 1));
  });
  return lines;
}

function calculateTotal(lines: InvoiceLineItem[]): number {
  return lines.reduce((sum, line) => {
    const amount = line.priceComponent?.find((comp) => comp.type === "base")?.amount?.value;
    return sum + (typeof amount === "number" ? amount : 0);
  }, 0);
}

function buildIdentifier(encounterId: string) {
  return [{ system: ENCOUNTER_IDENTIFIER_SYSTEM, value: encounterId }];
}

function ensureClinicIdentifier(invoice: Invoice, clinicId: string): Invoice {
  return {
    ...invoice,
    issuer: { reference: `Organization/${clinicId}` },
  };
}

async function findInvoiceByEncounter(encounterId: string): Promise<Invoice | null> {
  const medplum = await getMedplumClient();
  const existing = await medplum.searchResources<Invoice>("Invoice", {
    identifier: `${ENCOUNTER_IDENTIFIER_SYSTEM}|${encounterId}`,
    _count: "1",
  });
  return existing[0] ?? null;
}

export async function getInvoiceForEncounter(encounterId: string): Promise<Invoice | null> {
  return findInvoiceByEncounter(encounterId);
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const medplum = await getMedplumClient();
  try {
    return await medplum.readResource<Invoice>("Invoice", invoiceId);
  } catch (error) {
    console.error("Failed to read Invoice:", error);
    return null;
  }
}

export async function upsertInvoiceForEncounter(input: InvoiceInput): Promise<Invoice> {
  const medplum = await getMedplumClient();
  const existing = await findInvoiceByEncounter(input.encounterId);

  const lineItem = buildLineItems(input.procedures, input.prescriptions);
  const total = calculateTotal(lineItem);
  const dateString = input.encounterDate
    ? new Date(input.encounterDate).toISOString()
    : new Date().toISOString();

  const next: Invoice = ensureClinicIdentifier(
    {
      resourceType: "Invoice",
      status: existing?.status ?? "issued",
      id: existing?.id,
      identifier: existing?.identifier?.length ? existing.identifier : buildIdentifier(input.encounterId),
      subject: { reference: `Patient/${input.patientId}` },
      date: dateString,
      lineItem,
      totalNet: { value: total, currency: PRICE_CURRENCY },
      totalGross: { value: total, currency: PRICE_CURRENCY },
    },
    input.clinicId
  );

  if (existing?.id) {
    return await medplum.updateResource<Invoice>(next);
  }

  const created = await medplum.createResource<Invoice>(next);
  if (!created.id) {
    throw new Error("Failed to create Invoice (missing id)");
  }
  return created;
}

function extractLineType(line: InvoiceLineItem): LineType | "unknown" {
  const typeExt = line.extension?.find((ext) => ext.url === LINE_TYPE_EXTENSION_URL);
  const value = (typeExt as { valueCode?: string } | undefined)?.valueCode;
  return (value as LineType) ?? "unknown";
}

function extractLineNote(line: InvoiceLineItem): string {
  const noteExt = line.extension?.find((ext) => ext.url === LINE_NOTE_EXTENSION_URL);
  return (noteExt as { valueString?: string } | undefined)?.valueString ?? "";
}

function extractLineAmount(line: InvoiceLineItem): number {
  const amount = line.priceComponent?.find((component) => component.type === "base")?.amount?.value;
  return typeof amount === "number" ? amount : 0;
}

export function mapInvoiceToBillPayload(
  invoice: Invoice,
  options: { patientName: string; fallbackDate?: string | Date | null }
): BillPayload {
  const patientName = options.patientName || "Patient";
  const billDate =
    formatDisplayDate(invoice.date ?? options.fallbackDate ?? new Date()) || "N/A";

  const prescriptions: BillPayload["prescriptions"] = [];
  const procedures: BillPayload["procedures"] = [];

  (invoice.lineItem ?? []).forEach((line) => {
    const amount = extractLineAmount(line);
    const description = line.chargeItemCodeableConcept?.text ?? "Item";
    const lineType = extractLineType(line);
    const note = extractLineNote(line);

    if (lineType === "prescription") {
      prescriptions.push({
        name: description,
        dosage: note || "-",
        price: amount,
      });
    } else if (lineType === "procedure") {
      procedures.push({
        name: description,
        description: note || "-",
        price: amount,
      });
    } else {
      // Default to procedures when type unknown to ensure visibility
      procedures.push({
        name: description,
        description: note || "-",
        price: amount,
      });
    }
  });

  return {
    id: invoice.id ?? invoice.identifier?.[0]?.value ?? "invoice",
    patientName,
    date: billDate,
    prescriptions,
    procedures,
  };
}
