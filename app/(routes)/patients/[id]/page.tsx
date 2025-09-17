export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar, FileText, AlertCircle, User, Phone, Mail, Heart, Users, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Patient, getPatientById, Consultation, getConsultationsByPatientId } from "@/lib/models";
import { formatDisplayDate, calculateAge, safeToISOString } from "@/lib/utils";
import ReferralMCSection from "./referral-mc-section";
import { Suspense } from 'react';
import { PatientCard } from "@/components/patients/patient-card";
import { notFound } from 'next/navigation';
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

  // Fetch data in parallel
  const [patientData, consultationsData] = await Promise.all([
    getPatientById(id),
    getConsultationsByPatientId(id),
  ]);

  if (!patientData) {
    notFound();
  }

  // Serialize patient data
  const patient = {
    ...patientData,
    dateOfBirth: safeToISOString(patientData.dateOfBirth),
    lastVisit: safeToISOString(patientData.lastVisit),
    upcomingAppointment: safeToISOString(patientData.upcomingAppointment),
    // Add other potential date/timestamp fields here if they exist on Patient model
    createdAt: safeToISOString(patientData.createdAt), 
    updatedAt: safeToISOString(patientData.updatedAt),
    queueAddedAt: safeToISOString(patientData.queueAddedAt), 
  };

   // Serialize consultations data
   const consultations = consultationsData.map(consultation => ({
     ...consultation,
     date: safeToISOString(consultation.date),
     // Add other potential date/timestamp fields here if they exist on Consultation model
   }));

  // Check for medical alerts based on INTERNAL data
  const hasAllergies = patientData.medicalHistory?.allergies?.length > 0;
  const hasConditions = patientData.medicalHistory?.conditions?.length > 0;
  const medicalAlert = hasAllergies || hasConditions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
        <div className="flex items-center gap-2">
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
            {hasAllergies && `Allergies: ${Array.isArray(patientData.medicalHistory.allergies) ? patientData.medicalHistory.allergies.join(', ') : patientData.medicalHistory.allergies}. `}
            {hasConditions && `Conditions: ${Array.isArray(patientData.medicalHistory.conditions) ? patientData.medicalHistory.conditions.join(', ') : patientData.medicalHistory.conditions}.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Internal Patient Card */}
        <PatientCard patient={patient} />

        {/* Remove FHIR Gender Card */}
        {/* Remove FHIR DoB Card */}

        {/* Last Visit Card (using internal data) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">Last Visit</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {patient.lastVisit ? formatDisplayDate(patient.lastVisit) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Appointment Card (using internal data) */}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointment</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {patient.upcomingAppointment ? formatDisplayDate(patient.upcomingAppointment) : 'None'}
              </div>
              {/* Optionally add time if available */}
            </CardContent>
          </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Consultation History</TabsTrigger>
          <TabsTrigger value="details">Patient Details</TabsTrigger>
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
                          {consultation.type || 'Consultation'}
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
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/consultations/${consultation.id}`}>View Details</Link>
                          </Button>
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

        {/* Patient Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                 <div className="flex items-center">
                   <User className="h-4 w-4 mr-2 text-muted-foreground" />
                   <span>{patient.gender} | Age: {calculateAge(patient.dateOfBirth)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Address</p>
                <p className="text-muted-foreground">
                  {patient.address}<br />
                  {patient.postalCode}
                </p>
              </div>
               <div className="space-y-2">
                 <p className="font-medium">Emergency Contact</p>
                 <div className="text-muted-foreground">
                   <p>{patient.emergencyContact?.name} ({patient.emergencyContact?.relationship})</p>
                   <p>{patient.emergencyContact?.phone}</p>
                 </div>
               </div>
                <div className="space-y-2">
                  <p className="font-medium">Medical History</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Allergies: {Array.isArray(patientData.medicalHistory?.allergies) && patientData.medicalHistory.allergies.length > 0 ? patientData.medicalHistory.allergies.join(', ') : 'None'}</li>
                    <li>Conditions: {Array.isArray(patientData.medicalHistory?.conditions) && patientData.medicalHistory.conditions.length > 0 ? patientData.medicalHistory.conditions.join(', ') : 'None'}</li>
                     <li>Medications: {Array.isArray(patientData.medicalHistory?.medications) && patientData.medicalHistory.medications.length > 0 ? patientData.medicalHistory.medications.join(', ') : 'None'}</li>
                  </ul>
                </div>
            </CardContent>
          </Card>
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
