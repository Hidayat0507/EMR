import { getPatientById } from "@/lib/models";
import ConsultationForm from "./consultation-form";
import { notFound } from "next/navigation";

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

  return (
    <main className="min-h-screen bg-background">
      <ConsultationForm patientId={resolvedParams.id} />
    </main>
  );
}