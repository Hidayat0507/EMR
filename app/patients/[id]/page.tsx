'use client';

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, AlertCircle, Clock, FileText, User, Phone, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import { type Patient, type Consultation, getPatientById, getConsultationsByPatientId } from "@/lib/models";
import { formatDisplayDate } from "@/lib/utils";
import ReferralMCSection from "./referral-mc-section";
import { use, Suspense } from 'react';
import { PatientCard } from "@/components/patients/patient-card";
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function fetchPatientData(patientId: string) {
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      notFound();
    }
    const consultations = await getConsultationsByPatientId(patientId);
    return { patient, consultations };
  } catch (error) {
    console.error("Failed to fetch patient data:", error);
    throw new Error('Failed to load patient data');
  }
}

function PatientProfile({ patient, consultations }: {
  patient: Patient;
  consultations: Consultation[];
}) {
  const hasAllergies = patient.medicalHistory?.allergies?.length > 0;
  const hasConditions = patient.medicalHistory?.conditions?.length > 0;
  const medicalAlert = hasAllergies || hasConditions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/patients/${patient.id}/consultation`}>
              New Consultation
            </Link>
          </Button>
        </div>
      </div>

      {medicalAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Medical Alert</AlertTitle>
          <AlertDescription>
            {hasAllergies && `Allergies: ${patient.medicalHistory.allergies.join(', ')}. `}
            {hasConditions && `Conditions: ${patient.medicalHistory.conditions.join(', ')}.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <PatientCard patient={patient} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDisplayDate(patient.lastVisit)}</div>
            <p className="text-xs text-muted-foreground">
              Regular follow-up
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDisplayDate(patient.upcomingAppointment)}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled appointment
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="consultations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Patient&apos;s details and medical history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {patient.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last Visit: {formatDisplayDate(patient.lastVisit)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Clock className="h-4 w-4 opacity-70" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Next Appointment</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDate(patient.upcomingAppointment)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <User className="h-4 w-4 opacity-70" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Contact</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical History</p>
                <div className="grid gap-1">
                  <p className="text-sm">Conditions: {
                    Array.isArray(patient.medicalHistory.conditions) 
                      ? patient.medicalHistory.conditions.join(', ') || 'N/A' 
                      : patient.medicalHistory.conditions || 'N/A'
                  }</p>
                  <p className="text-sm">Allergies: {
                    Array.isArray(patient.medicalHistory.allergies) 
                      ? patient.medicalHistory.allergies.join(', ') || 'N/A' 
                      : patient.medicalHistory.allergies || 'N/A'
                  }</p>
                  <p className="text-sm">Medications: {
                    Array.isArray(patient.medicalHistory.medications) 
                      ? patient.medicalHistory.medications.join(', ') || 'N/A' 
                      : patient.medicalHistory.medications || 'N/A'
                  }</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                <div className="grid gap-1">
                  <p className="text-sm">Name: {patient.emergencyContact?.name || 'N/A'}</p>
                  <p className="text-sm">Relationship: {patient.emergencyContact?.relationship || 'N/A'}</p>
                  <p className="text-sm">Phone: {patient.emergencyContact?.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-3">
                 <h3 className="font-semibold">Details</h3>
                 <div className="text-sm space-y-1">
                   <p><strong>NRIC:</strong> {patient.nric}</p>
                   <p><strong>DoB:</strong> {formatDisplayDate(patient.dateOfBirth)}</p>
                   <p><strong>Gender:</strong> {patient.gender}</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultations">
          <Card>
            <CardHeader>
              <CardTitle>Consultation History</CardTitle>
              <CardDescription>Previous consultations and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              {consultations.length > 0 ? (
                <div className="space-y-2">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {consultation.type || 'General Consultation'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {consultation.doctor || 'N/A'} - {formatDisplayDate(consultation.date)}
                        </p>
                      </div>
                      <Button variant="ghost" asChild>
                        <Link href={`/consultations/${consultation.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No consultation records found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs History</CardTitle>
              <CardDescription>Patient&apos;s vital measurements over time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No vital signs recorded yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <ReferralMCSection patient={patient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PatientProfilePageWrapper({ params }: Props) {
  const resolvedParams = use(params);
  const { patient, consultations } = use(fetchPatientData(resolvedParams.id));

  return <PatientProfile patient={patient} consultations={consultations} />;
}