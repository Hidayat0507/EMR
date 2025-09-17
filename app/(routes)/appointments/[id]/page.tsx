import { notFound } from "next/navigation";

import { loadModulePage } from "@/lib/module-registry";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AppointmentDetailsPage(props: Props) {
  const ModulePage = await loadModulePage("appointments", "detail");

  if (!ModulePage) {
    notFound();
  }

  return <ModulePage {...props} />;
}
