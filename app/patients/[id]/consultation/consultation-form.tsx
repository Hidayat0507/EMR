"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Patient, getPatientById, Prescription, ProcedureRecord, createConsultation } from "@/lib/models";
import { updateQueueStatus } from "@/lib/actions";
import { safeToISOString } from "@/lib/utils";
import PrescriptionForm from "./prescription-form";
import { PatientCard, SerializedPatient } from "@/components/patients/patient-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Common procedures list
const commonProcedures = [
  { id: "toilet", label: "Toilet & Dressing", price: 50.00 },
  { id: "suturing", label: "Suturing", price: 120.00 },
  { id: "incision", label: "Incision & Drainage", price: 150.00 },
  { id: "injection", label: "Injection", price: 30.00 },
  { id: "removal", label: "Foreign Body Removal", price: 80.00 },
];

export default function ConsultationForm({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<SerializedPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTreatmentOpen, setIsTreatmentOpen] = useState(true);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(true);
  
  // Form state
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadPatient() {
      try {
        const patientData = await getPatientById(patientId);
        if (patientData) {
          // Serialize patient data before setting state
          const serializedPatient = {
            ...patientData,
            dateOfBirth: safeToISOString(patientData.dateOfBirth),
            lastVisit: safeToISOString(patientData.lastVisit),
            upcomingAppointment: safeToISOString(patientData.upcomingAppointment),
            createdAt: safeToISOString(patientData.createdAt),
            updatedAt: safeToISOString(patientData.updatedAt),
            queueAddedAt: safeToISOString(patientData.queueAddedAt),
          };
          setPatient(serializedPatient);
        } else {
          setPatient(null);
        }
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [patientId]);

  const handleProcedureToggle = (procedureId: string) => {
    setSelectedProcedures(prev => 
      prev.includes(procedureId)
        ? prev.filter(id => id !== procedureId)
        : [...prev, procedureId]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!chiefComplaint || !diagnosis) {
      toast({
        title: "Validation Error",
        description: "Please fill in Chief Complaint and Diagnosis",
        variant: "destructive"
      });
      return;
    }

    try {
      // Map selected procedure IDs to ProcedureRecord objects
      const procedureRecords: ProcedureRecord[] = selectedProcedures.map(procId => {
        const procedureInfo = commonProcedures.find(p => p.id === procId);
        return {
          name: procedureInfo?.label || procId, // Use label as name, fallback to ID
          price: procedureInfo?.price // Price comes from the commonProcedures list
        };
      });

      const consultationData = {
        patientId,
        date: new Date(), // Consider using server timestamp later
        chiefComplaint,
        diagnosis,
        procedures: procedureRecords, // Use the mapped array
        notes: additionalNotes,
        prescriptions: prescriptions // Assuming prescriptions state already holds objects with price?
      };

      const consultationId = await createConsultation(consultationData);

      if (consultationId) {
        // Update queue status AFTER successful consultation save
        await updateQueueStatus(patientId, 'meds_and_bills');

        toast({
          title: "Consultation Saved",
          description: "Consultation has been successfully recorded.",
        });
        
        // Redirect to patient profile or consultation details
        router.push(`/patients/${patientId}`);
      } else {
        throw new Error('Failed to save consultation');
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error",
        description: "Failed to save consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="p-6">Patient not found</div>;
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
        {patient && <PatientCard patient={patient} />}

        {/* Consultation Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Treatment Section */}
          <Collapsible open={isTreatmentOpen} onOpenChange={setIsTreatmentOpen}>
            <Card className="border-none shadow-none">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-2xl">Consultation</CardTitle>
                    <CardDescription className="text-base">Record patient&apos;s condition and procedures</CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-muted/50">
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
                <CardContent className="p-0 pt-6">
                  <div className="space-y-6">
                    <div>
                      <Label>Chief Complaint</Label>
                      <Textarea 
                        placeholder="Patient's main symptoms or concerns..." 
                        className="mt-1.5 min-h-[150px]"
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Diagnosis</Label>
                      <Input 
                        placeholder="Clinical diagnosis..." 
                        className="mt-1.5"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Common Procedures</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {commonProcedures.map((procedure) => (
                          <div key={procedure.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={procedure.id}
                              checked={selectedProcedures.includes(procedure.id)}
                              onCheckedChange={() => handleProcedureToggle(procedure.id)}
                            />
                            <label 
                              htmlFor={procedure.id} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {procedure.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Procedures / Notes</Label>
                      <Textarea 
                        placeholder="Describe any additional procedures or specific details..."
                        className="min-h-[100px]"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Prescriptions */}
          <Collapsible open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
            <Card className="border-none shadow-none">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <CardTitle className="text-2xl">Prescriptions</CardTitle>
                    <CardDescription className="text-base">Add medications for the patient</CardDescription>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="hover:bg-muted/50">
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
                <CardContent className="p-0 pt-6">
                  <PrescriptionForm 
                    onPrescriptionsChange={setPrescriptions}
                    initialPrescriptions={prescriptions}
                  />
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