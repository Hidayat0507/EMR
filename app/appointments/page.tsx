import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, Calendar as CalendarIcon, Search, Filter } from "lucide-react";
import Link from "next/link";

// Mock appointment data
const appointments = [
  {
    id: "1",
    patientName: "John Doe",
    type: "Follow-up",
    date: "2024-01-20",
    time: "09:00 AM",
    doctor: "Dr. Smith",
    status: "Confirmed",
  },
  {
    id: "2",
    patientName: "Jane Smith",
    type: "Initial Consultation",
    date: "2024-01-20",
    time: "10:30 AM",
    doctor: "Dr. Johnson",
    status: "Pending",
  },
  {
    id: "3",
    patientName: "David Wilson",
    type: "Review",
    date: "2024-01-20",
    time: "02:00 PM",
    doctor: "Dr. Brown",
    status: "Confirmed",
  },
];

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and schedules
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Calendar and Stats */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View and manage appointments</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full max-w-sm mx-auto">
              <Calendar
                mode="single"
                selected={new Date()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Today&apos;s Schedule</CardTitle>
            <CardDescription>Upcoming appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search appointments..."
                    className="pl-9 pr-4 py-2 w-full rounded-md border border-input bg-transparent"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Appointment List */}
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {appointment.time} - {appointment.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          appointment.status === "Confirmed"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Appointment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Appointments
                </p>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">+2 from yesterday</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Upcoming
                </p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Next 4 hours</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Cancelled
                </p>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}