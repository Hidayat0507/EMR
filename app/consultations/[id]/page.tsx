import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { consultations } from "@/lib/data";

// Generate static params for all consultations
export function generateStaticParams() {
  const params: { id: string }[] = [];
  
  // Collect all consultation IDs across all patients
  Object.values(consultations).forEach(patientConsultations => {
    patientConsultations.forEach(consultation => {
      params.push({ id: consultation.id });
    });
  });
  
  return params;
}

// Find consultation across all patients
function findConsultation(consultationId: string) {
  for (const patientConsultations of Object.values(consultations)) {
    const consultation = patientConsultations.find(c => c.id === consultationId);
    if (consultation) return consultation;
  }
  return null;
}

export default function ConsultationDetails({ params }: { params: { id: string } }) {
  const consultation = findConsultation(params.id);

  if (!consultation) {
    return <div>Consultation not found</div>;
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <Button variant="ghost" className="p-0" asChild>
          <Link
            href="/records"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Records
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Consultation Header */}
        <Card>
          <CardHeader>
            <CardTitle>Consultation Details</CardTitle>
            <CardDescription>
              {consultation.date} - {consultation.doctor}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium mb-2">Type</h3>
                <p>{consultation.type}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="whitespace-pre-wrap">{consultation.notes}</p>
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
                      <li key={index}>{procedure}</li>
                    ))}
                  </ul>
                </div>
              )}
              {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Prescriptions</h3>
                  <div className="space-y-4">
                    {consultation.prescriptions.map((prescription, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <p className="font-medium">{prescription.medication}</p>
                        <p className="text-sm text-muted-foreground">
                          {prescription.dosage} - {prescription.frequency} for {prescription.duration}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}