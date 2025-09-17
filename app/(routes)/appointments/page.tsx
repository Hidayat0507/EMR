import { notFound } from "next/navigation";

import { loadModulePage } from "@/lib/module-registry";

export default async function AppointmentsPage() {
  const ModulePage = await loadModulePage("appointments");

  if (!ModulePage) {
    notFound();
  }

  return <ModulePage />;
}
