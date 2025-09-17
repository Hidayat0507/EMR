"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAppointments, type Appointment, type AppointmentStatus } from "@/lib/models";
import { formatDisplayDate } from "@/lib/utils";

const activeStatuses: AppointmentStatus[] = ["scheduled", "checked_in", "in_progress"];

function formatDateTime(date: Date | string): { day: string; time: string } {
  const instance = date instanceof Date ? date : new Date(date);
  return {
    day: instance.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: instance.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  checked_in: "Checked in",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const statusVariants: Record<AppointmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "secondary",
  checked_in: "default",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

export default function AppointmentsRootPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      setError(null);
      setLoading(true);
      try {
        const data = await getAppointments();
        if (!cancelled) {
          setAppointments(data);
        }
      } catch (err) {
        console.error("Failed to load appointments", err);
        if (!cancelled) {
          setError("Unable to load appointments right now. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAppointments();
    return () => {
      cancelled = true;
    };
  }, []);

  const now = useMemo(() => new Date(), []);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        if (!appointment.scheduledAt) return false;
        const scheduled = appointment.scheduledAt instanceof Date ? appointment.scheduledAt : new Date(appointment.scheduledAt);
        return scheduled.getTime() >= now.getTime() && activeStatuses.includes(appointment.status);
      })
      .sort((a, b) => {
        const aTime = new Date(a.scheduledAt as any).getTime();
        const bTime = new Date(b.scheduledAt as any).getTime();
        return aTime - bTime;
      });
  }, [appointments, now]);

  const todaysAppointments = useMemo(() => {
    return upcomingAppointments.filter((appointment) => {
      const scheduled = appointment.scheduledAt instanceof Date ? appointment.scheduledAt : new Date(appointment.scheduledAt);
      const today = new Date();
      return (
        scheduled.getFullYear() === today.getFullYear() &&
        scheduled.getMonth() === today.getMonth() &&
        scheduled.getDate() === today.getDate()
      );
    });
  }, [upcomingAppointments]);

  const statusCounts = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        acc.total++;
        acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
        return acc;
      },
      {
        total: 0,
        scheduled: 0,
        checked_in: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
      } as Record<AppointmentStatus | "total", number>
    );
  }, [appointments]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage patient bookings and keep track of upcoming visits.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/appointments/new">New appointment</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/patients">View patients</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total appointments</CardTitle>
            <CardDescription>Across all statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming today</CardTitle>
            <CardDescription>Remaining for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active bookings</CardTitle>
            <CardDescription>Scheduled and in-progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusCounts.scheduled + statusCounts.checked_in + statusCounts.in_progress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed this week</CardTitle>
            <CardDescription>Marked as done</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
          </CardContent>
        </Card>
      </section>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming appointments</h2>
          <span className="text-sm text-muted-foreground">
            Showing {upcomingAppointments.length} upcoming
          </span>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 animate-pulse" /> Loading appointments...
            </CardContent>
          </Card>
        ) : null}

        {!loading && upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No upcoming appointments yet. Schedule one to see it listed here.
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {upcomingAppointments.map((appointment) => {
            const { day, time } = formatDateTime(appointment.scheduledAt);
            return (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                    <Badge variant={statusVariants[appointment.status]}>{statusLabels[appointment.status]}</Badge>
                  </div>
                  <CardDescription>{appointment.reason || "Clinic visit"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4 text-muted-foreground" /> {day}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" /> {time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" /> {appointment.clinician}
                    </span>
                    {appointment.location ? (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {appointment.location}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground">
                    Booked on {formatDisplayDate(appointment.createdAt)}
                  </div>
                  {appointment.notes ? (
                    <p className="rounded-md bg-muted p-3 text-muted-foreground">{appointment.notes}</p>
                  ) : null}
                  <Button className="w-full" variant="secondary" asChild>
                    <Link href={`/appointments/${appointment.id}`}>View details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
