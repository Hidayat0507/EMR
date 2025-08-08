import { getPatientById } from "@/lib/models";
import ConsultationForm from "./consultation-form";
import { notFound } from "next/navigation";
import { safeToISOString } from "@/lib/utils";
import { SerializedPatient } from "@/components/patients/patient-card";

// Update PageProps for async Server Component
type Props = {
  params: Promise<{ id: string }>
  // Assuming searchParams might be used, include it as a Promise too
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ConsultationPage({ params, searchParams }: Props) {
  // Await params
  const resolvedParams = await params;
  const patient = await getPatientById(resolvedParams.id);
  
  if (!patient) {
    notFound();
  }

  // Serialize patient for client component
  const initialPatient: SerializedPatient = {
    ...patient,
    dateOfBirth: safeToISOString(patient.dateOfBirth),
    lastVisit: safeToISOString(patient.lastVisit),
    upcomingAppointment: safeToISOString(patient.upcomingAppointment),
    createdAt: safeToISOString(patient.createdAt),
    updatedAt: safeToISOString(patient.updatedAt),
    queueAddedAt: safeToISOString(patient.queueAddedAt),
  };

  return (
    <main className="min-h-screen bg-background">
      <ConsultationForm patientId={resolvedParams.id} initialPatient={initialPatient} />
    </main>
  );
}