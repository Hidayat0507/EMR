import type { ModuleDefinition } from "@/lib/module-registry";

const moduleDefinition = {
  id: "appointments",
  label: "Appointments",
  description: "Schedule and track patient appointments.",
  routePath: "/appointments",
  icon: "calendar",
  pages: {
    default: {
      title: "Appointments",
      description: "Overview of upcoming and recent patient appointments.",
      load: () => import("./pages/appointments-root"),
    },
    create: {
      title: "Schedule appointment",
      description: "Book a new patient appointment.",
      load: () => import("./pages/appointments-create"),
    },
    detail: {
      title: "Appointment details",
      description: "Review and update a specific appointment.",
      load: () => import("./pages/appointments-detail"),
    },
  },
} satisfies ModuleDefinition;

export default moduleDefinition;

