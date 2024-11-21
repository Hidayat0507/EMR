"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { patients } from "@/lib/data";
import PrescriptionForm from "@/components/prescription-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

// Common procedures list
const commonProcedures = [
  { id: "toilet", label: "Toilet & Dressing" },
  { id: "suturing", label: "Suturing" },
  { id: "incision", label: "Incision & Drainage" },
  { id: "injection", label: "Injection" },
  { id: "removal", label: "Foreign Body Removal" },
];

export default function ConsultationForm({ patientId }: { patientId: string }) {
  const patient = patients.find(p => p.id === patientId);
  const [isTreatmentOpen, setIsTreatmentOpen] = useState(true);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(true);

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <Link
          href={`/patients/${patientId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient Profile
        </Link>
      </div>

      <div className="space-y-6">
        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <CardTitle>New Consultation</CardTitle>
            <CardDescription>
              Patient: {patient.fullName} ({patient.nric})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Age:</span>{" "}
                {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}
              </div>
              <div>
                <span className="text-muted-foreground">Gender:</span>{" "}
                {patient.gender}
              </div>
              <div>
                <span className="text-muted-foreground">Last Visit:</span>{" "}
                {patient.lastVisit}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultation Form */}
        <form className="space-y-6">
          {/* Consultation Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Consultation Notes</CardTitle>
              <CardDescription>
                Document the consultation details including chief complaint, examination findings, and treatment plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter consultation notes..."
                  className="min-h-[300px] font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
              <CardDescription>
                Enter the final diagnosis and any differential diagnoses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter diagnosis..."
                  className="min-h-[80px] font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Treatment */}
          <Collapsible open={isTreatmentOpen} onOpenChange={setIsTreatmentOpen}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Treatment</CardTitle>
                    <CardDescription>
                      Select the procedures performed during this consultation
                    </CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {isTreatmentOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {commonProcedures.map((procedure) => (
                        <div key={procedure.id} className="flex items-center space-x-2">
                          <Checkbox id={procedure.id} />
                          <Label htmlFor={procedure.id}>{procedure.label}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Procedures / Notes</Label>
                      <Textarea 
                        placeholder="Describe any additional procedures or specific details..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Prescriptions */}
          <Collapsible open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Prescriptions</CardTitle>
                    <CardDescription>Add medications for the patient</CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {isPrescriptionOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <PrescriptionForm />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" asChild>
              <Link href={`/patients/${patientId}`}>Cancel</Link>
            </Button>
            <Button type="submit">Save Consultation</Button>
          </div>
        </form>
      </div>
    </div>
  );
}