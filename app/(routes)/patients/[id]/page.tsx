export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, AlertCircle, ClipboardList } from "lucide-react";
import Link from "next/link";
import { getPatientFromMedplum } from "@/lib/fhir/patient-service";
import { getPatientConsultationsFromMedplum } from "@/lib/fhir/consultation-service";
import { formatDisplayDate, safeToISOString } from "@/lib/utils";
import ReferralMCSection from "./referral-mc-section";
import { Suspense } from 'react';
import { PatientCard } from "@/components/patients/patient-card";
import type { SerializedPatient } from "@/components/patients/patient-card";
import { LabResultsView } from "@/components/labs/lab-results-view";
import { ImagingResultsView } from "@/components/imaging/imaging-results-view";
import { notFound } from 'next/navigation';
import { getTriageForPatient } from "@/lib/fhir/triage-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PatientDocuments from "@/components/patients/patient-documents";

interface PatientProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientProfilePage({ params }: PatientProfilePageProps) {
  const { id } = await params;

  // Fetch data in parallel from Medplum FHIR (source of truth)
  const [patientData, consultationsData, triageData] = await Promise.all([
    getPatientFromMedplum(id), // 🎯 Read from Medplum FHIR
    getPatientConsultationsFromMedplum(id), // 🎯 Read from Medplum FHIR
    getTriageForPatient(id),
  ]);

  if (!patientData) {
    notFound();
  }

  const medicalHistory = patientData.medicalHistory ?? {
    allergies: [],
    conditions: [],
    medications: [],
  };
  const vitals = triageData.triage?.vitalSigns;

  // Serialize patient data
  const patient: SerializedPatient = {
    ...patientData,
    email: patientData.email ?? "",
    postalCode: patientData.postalCode ?? "",
    emergencyContact: patientData.emergencyContact ?? {
      name: "",
      relationship: "",
      phone: "",
    },
    medicalHistory,
    triage: triageData.triage as any,
    queueStatus: triageData.queueStatus ?? null,
    dateOfBirth: safeToISOString(patientData.dateOfBirth),
    lastVisit: safeToISOString((patientData as any).lastVisit),
    upcomingAppointment: safeToISOString((patientData as any).upcomingAppointment),
    // Add other potential date/timestamp fields here if they exist on Patient model
    createdAt: safeToISOString((patientData as any).createdAt),
    updatedAt: safeToISOString((patientData as any).updatedAt),
    queueAddedAt: safeToISOString(triageData.queueAddedAt ?? null),
  };

  // Serialize consultations data
  const consultations = consultationsData.map(consultation => ({
    ...consultation,
    date: safeToISOString(consultation.date),
    // Add other potential date/timestamp fields here if they exist on Consultation model
  }));

  // Check for medical alerts based on INTERNAL data
  const hasAllergies = medicalHistory.allergies?.length > 0;
  const medicalAlert = hasAllergies;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
        <div className="flex items-center gap-2">
          {/* Triage Button - Show if not triaged or not in queue */}
          {(!patient.triage?.isTriaged || !patient.queueStatus) && (
            <Button asChild variant="outline">
              <Link href={`/patients/${id}/triage`}>
                <ClipboardList className="mr-2 h-4 w-4" /> Triage
              </Link>
            </Button>
          )}
          {/* Add back New Consultation Button */}
          <Button asChild>
            <Link href={`/patients/${id}/consultation`}>
              <FileText className="mr-2 h-4 w-4" /> New Consultation
            </Link>
          </Button>
          {/* Add other actions like Edit Patient if needed */}
        </div>
      </div>

      {/* Display Medical Alert based on internal data */}
      {medicalAlert && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Medical Alert</AlertTitle>
            <AlertDescription>
            {hasAllergies && `Allergies: ${Array.isArray(medicalHistory.allergies) ? medicalHistory.allergies.join(', ') : medicalHistory.allergies}.`}
            </AlertDescription>
          </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Internal Patient Card */}
        <PatientCard patient={patient} compact />

        {/* Latest Vitals */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Latest Vitals</CardTitle>
            <CardDescription>From last triage (if available)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">BP</p>
              <p className="font-medium text-xs">
                {vitals?.bloodPressureSystolic && vitals?.bloodPressureDiastolic
                  ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">HR</p>
              <p className="font-medium text-xs">
                {vitals?.heartRate ? `${vitals.heartRate} bpm` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">RR</p>
              <p className="font-medium text-xs">
                {vitals?.respiratoryRate ? `${vitals.respiratoryRate} /min` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Temp</p>
              <p className="font-medium text-xs">
                {vitals?.temperature ? `${vitals.temperature} °C` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">SpO₂</p>
              <p className="font-medium text-xs">
                {vitals?.oxygenSaturation ? `${vitals.oxygenSaturation}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Pain</p>
              <p className="font-medium text-xs">
                {typeof vitals?.painScore === "number" ? vitals.painScore : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Weight</p>
              <p className="font-medium text-xs">
                {vitals?.weight ? `${vitals.weight} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Height</p>
              <p className="font-medium text-xs">
                {vitals?.height ? `${vitals.height} cm` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Consultation History</TabsTrigger>
          <TabsTrigger value="labs-imaging">Labs & Imaging</TabsTrigger>
          <TabsTrigger value="referral-mc">Referral / MC</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Consultation History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Consultation History</CardTitle>
              <CardDescription>
                Past consultations for {patient.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consultations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Complaint</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Prescriptions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell className="font-medium">
                          {formatDisplayDate(consultation.date)}
                        </TableCell>
                        <TableCell>
                          {'Consultation'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {consultation.chiefComplaint}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {consultation.diagnosis}
                        </TableCell>
                        <TableCell>
                          {consultation.prescriptions?.length || 0} items
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/consultations/${consultation.id}`}>View</Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/consultations/${consultation.id}/edit`}>Edit</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No consultation history found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labs-imaging">
          <div className="grid gap-4 lg:grid-cols-2">
            <LabResultsView patientId={id} />
            <ImagingResultsView patientId={id} />
          </div>
        </TabsContent>

        {/* Referral / MC Tab */}
        <TabsContent value="referral-mc">
          <Suspense fallback={<div>Loading form...</div>}>
            <ReferralMCSection patient={patient} />
          </Suspense>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          {/* Client-side uploader and list */}
          <PatientDocuments patientId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
