"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const appointmentFormSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  patientId: z.string().min(1, "Patient ID is required"),
  appointmentType: z.string().min(1, "Please select an appointment type"),
  date: z.date({
    required_error: "Please select a date",
  }),
  time: z.string().min(1, "Please select a time"),
  doctor: z.string().min(1, "Please select a doctor"),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

const defaultValues: Partial<AppointmentFormValues> = {
  notes: "",
};

export default function NewAppointment() {
  const { toast } = useToast();
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  });

  async function onSubmit(data: AppointmentFormValues) {
    try {
      // Here we'll add the Firebase integration later
      console.log(data);
      toast({
        title: "Success",
        description: "Appointment has been scheduled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule appointment.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Link
          href="/appointments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Appointments
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule New Appointment</CardTitle>
          <CardDescription>Create a new appointment for a patient</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                {/* Patient Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient ID</FormLabel>
                        <FormControl>
                          <Input placeholder="P12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Appointment Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="appointmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Appointment Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="initial">Initial Consultation</SelectItem>
                            <SelectItem value="followup">Follow-up</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="procedure">Procedure</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doctor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                            <SelectItem value="dr-johnson">Dr. Johnson</SelectItem>
                            <SelectItem value="dr-brown">Dr. Brown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date and Time */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-2 min-w-[280px]">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="09:00">09:00 AM</SelectItem>
                            <SelectItem value="09:30">09:30 AM</SelectItem>
                            <SelectItem value="10:00">10:00 AM</SelectItem>
                            <SelectItem value="10:30">10:30 AM</SelectItem>
                            <SelectItem value="11:00">11:00 AM</SelectItem>
                            <SelectItem value="11:30">11:30 AM</SelectItem>
                            <SelectItem value="14:00">02:00 PM</SelectItem>
                            <SelectItem value="14:30">02:30 PM</SelectItem>
                            <SelectItem value="15:00">03:00 PM</SelectItem>
                            <SelectItem value="15:30">03:30 PM</SelectItem>
                            <SelectItem value="16:00">04:00 PM</SelectItem>
                            <SelectItem value="16:30">04:30 PM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or instructions"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/appointments">Cancel</Link>
                </Button>
                <Button type="submit">Schedule Appointment</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}