import { notFound } from "next/navigation";
import { getConsultationById, getPatientById } from "@/lib/models";
import ConsultationForm from "@/app/(routes)/patients/[id]/consultation/consultation-form";
import { safeToISOString } from "@/lib/utils";
import type { SerializedPatient } from "@/components/patients/patient-card";
import type { SerializedConsultation } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditConsultationPage({ params }: Props) {
  const { id } = await params;
  const consultation = await getConsultationById(id);

  if (!consultation) {
    notFound();
  }

  const patient = await getPatientById(consultation.patientId);
  if (!patient) {
    notFound();
  }

  const initialPatient: SerializedPatient = {
    ...patient,
    dateOfBirth: safeToISOString(patient.dateOfBirth),
    lastVisit: safeToISOString(patient.lastVisit),
    upcomingAppointment: safeToISOString(patient.upcomingAppointment),
    createdAt: safeToISOString(patient.createdAt),
    updatedAt: safeToISOString(patient.updatedAt),
    queueAddedAt: safeToISOString(patient.queueAddedAt),
  };

  const initialConsultation: SerializedConsultation = {
    ...consultation,
    date: safeToISOString(consultation.date),
    createdAt: safeToISOString(consultation.createdAt),
    updatedAt: safeToISOString(consultation.updatedAt),
  };

  return (
    <main className="min-h-screen bg-background">
      <ConsultationForm
        patientId={consultation.patientId}
        initialPatient={initialPatient}
        initialConsultation={initialConsultation}
      />
    </main>
  );
}
