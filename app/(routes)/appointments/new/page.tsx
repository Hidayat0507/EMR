import { notFound } from "next/navigation";

import { loadModulePage } from "@/lib/module-registry";

export default async function NewAppointmentPage() {
  const ModulePage = await loadModulePage("appointments", "create");

  if (!ModulePage) {
    notFound();
  }

  return <ModulePage />;
}
