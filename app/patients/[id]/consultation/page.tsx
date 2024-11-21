import { patients } from "@/lib/data";
import ConsultationForm from "./consultation-form";

// Generate static params for all patients
export function generateStaticParams() {
  return patients.map((patient) => ({
    id: patient.id,
  }));
}

export default function ConsultationPage({ params }: { params: { id: string } }) {
  return <ConsultationForm patientId={params.id} />;
}