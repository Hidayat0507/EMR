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
      <div className="mb-6">
        <Button variant="ghost" className="p-0" asChild>
          <Link
            href={`/patients/${consultation.patientId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patient Profile
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Consultation Header */}
        <Card>
          <CardHeader>
            <CardTitle>Consultation Details</CardTitle>
            <CardDescription>
              {consultation.date.toLocaleDateString()} - {consultation.doctor}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium mb-2">Chief Complaint</h3>
                <p className="whitespace-pre-wrap">{consultation.chiefComplaint}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Diagnosis</h3>
                <p>{consultation.diagnosis}</p>
              </div>
              {consultation.procedures && consultation.procedures.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Procedures</h3>
                  <ul className="list-disc list-inside">
                    {consultation.procedures.map((procedure, index) => (
                      <li key={index}>
                        {procedure.name}
                        {procedure.price && ` - $${procedure.price.toFixed(2)}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {consultation.notes && (
                <div>
                  <h3 className="font-medium mb-2">Additional Procedures / Notes</h3>
                  <p className="whitespace-pre-wrap">{consultation.notes}</p>
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