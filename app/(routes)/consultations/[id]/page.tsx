import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Consultation, getConsultationById } from "@/lib/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define the props type according to Next.js App Router conventions for async Server Components
type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "N/A";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
}

function formatConsultationNotes(raw?: string | null) {
  if (!raw) return "";
  const text = raw.trim();
  if (!text) return "";

  // If notes are saved in a structured block, show only the clinical note body
  // because diagnosis/procedures are already displayed in dedicated sections.
  const clinicalNotesMatch = text.match(/clinical\s*notes\s*:\s*([\s\S]*)$/i);
  if (clinicalNotesMatch?.[1]) {
    const clinicalOnly = clinicalNotesMatch[1].trim();
    if (clinicalOnly) return clinicalOnly;
  }

  return text;
}

export default async function ConsultationDetails({ params }: Props) {
  // Directly await the params promise
  const { id } = await params; 
  
  // Fetch the specific consultation using the id
  const consultation: Consultation | null = await getConsultationById(id);

  if (!consultation) {
    return <div>Consultation not found</div>;
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" className="p-0" asChild>
          <Link
            href={`/patients/${consultation.patientId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient Profile
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/consultations/${consultation.id}/edit`}>Edit Consultation</Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Consultation Header */}
        <Card>
          <CardHeader>
            <CardTitle>Consultation Details</CardTitle>
            <CardDescription>
              {consultation.date.toLocaleDateString()}
              {consultation.doctor ? ` - ${consultation.doctor}` : ""}
            </CardDescription>
            <CardDescription>
              Created: {formatDateTime(consultation.createdAt)} | Last Updated: {formatDateTime(consultation.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium mb-2">Chief Complaint</h3>
                <p className="whitespace-pre-wrap">{consultation.chiefComplaint || "Not documented"}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Diagnosis</h3>
                <p>{consultation.diagnosis}</p>
              </div>
              {consultation.procedures && consultation.procedures.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Procedures</h3>
                  <div className="space-y-2">
                    {consultation.procedures.map((procedure, index) => (
                      <div key={index} className="rounded-md border p-2">
                        <div>
                          {procedure.name}
                          {typeof procedure.price === "number" && procedure.price > 0
                            ? ` - $${procedure.price.toFixed(2)}`
                            : ""}
                        </div>
                        {procedure.notes && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            Notes: {procedure.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formatConsultationNotes(consultation.notes) && (
                <div>
                  <h3 className="font-medium mb-2">Consultation Notes</h3>
                  <p className="whitespace-pre-wrap">{formatConsultationNotes(consultation.notes)}</p>
                </div>
              )}
              {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Prescriptions</h3>
                  <ul className="space-y-1">
                    {consultation.prescriptions.map((prescription, index) => (
                      <li key={index}>
                        {prescription.medication.name} {prescription.frequency} {prescription.duration}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
