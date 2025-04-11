"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPatient, Patient } from "@/lib/models";
import { useRouter } from "next/navigation";
import React from "react";

const patientFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  nric: z.string().regex(/^\d{6}-\d{2}-\d{4}$/, "Invalid NRIC format (e.g., 880705-56-5975)"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number"),
  address: z.string().optional().or(z.literal("")),
  postalCode: z.string().regex(/^\d{5}$/, "Postal code must be 5 digits").optional().or(z.literal("")),
  emergencyContact: z.object({
    name: z.string().optional().or(z.literal("")),
    relationship: z.string().optional().or(z.literal("")),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number").optional().or(z.literal("")),
  }).optional().default({}),
  medicalHistory: z.object({
    allergies: z.string().optional().or(z.literal("")),
    chronicConditions: z.string().optional().or(z.literal("")),
    currentMedications: z.string().optional().or(z.literal("")),
  }).optional().default({}),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <FormLabel className="after:content-[&quot;*&quot;] after:ml-0.5 after:text-red-500">
    {children}
  </FormLabel>
);

export default function NewPatient() {
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: "",
      nric: "",
      dateOfBirth: "",
      gender: undefined,
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      medicalHistory: {
        allergies: "",
        chronicConditions: "",
        currentMedications: "",
      },
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
      },
    },
  });

  // Function to format NRIC input with dashes
  const formatNRIC = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 6) {
      return numbers;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 6)}-${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 6)}-${numbers.slice(6, 8)}-${numbers.slice(8, 12)}`;
    }
  };

  // Function to convert NRIC date to ISO format
  const getNRICDate = (nric: string): string => {
    const birthDate = nric.slice(0, 6); // Get first 6 digits
    const year = parseInt(birthDate.slice(0, 2));
    const month = parseInt(birthDate.slice(2, 4));
    const day = parseInt(birthDate.slice(4, 6));
    
    // Determine century (assuming 19xx for years 00-29, 20xx for years 30-99)
    const fullYear = year + (year >= 30 ? 1900 : 2000);
    
    // Format the date manually to avoid timezone issues
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    
    return `${fullYear}-${formattedMonth}-${formattedDay}`;
  };

  // Watch NRIC field for changes
  const nric = form.watch('nric');

  // Update date of birth when NRIC changes
  React.useEffect(() => {
    if (nric && nric.length >= 6) {
      const birthDate = getNRICDate(nric.replace(/[^0-9]/g, ''));
      form.setValue('dateOfBirth', birthDate);
    }
  }, [nric, form]);

  async function onSubmit(data: PatientFormValues) {
    console.log('Form submitted with data:', data);
    try {
      // Convert dateOfBirth string to Date object, handle potential empty string
      let dateOfBirthObj: Date | undefined;
      if (data.dateOfBirth) {
        try {
          dateOfBirthObj = new Date(data.dateOfBirth);
          // Optional: Add check for invalid date if necessary
          if (isNaN(dateOfBirthObj.getTime())) {
             dateOfBirthObj = undefined; // Or handle error
             console.error("Invalid dateOfBirth string:", data.dateOfBirth);
             // Optionally show a toast error to the user here
          }
        } catch (dateError) {
          console.error("Error parsing dateOfBirth:", dateError);
          dateOfBirthObj = undefined; // Or handle error
        }
      } else {
        // Handle case where dateOfBirth might be intentionally empty
        // Depending on requirements, set to undefined, null, or a default date
        dateOfBirthObj = undefined; 
      }

      // Clean the data 
      const cleanData = {
        fullName: data.fullName,
        dateOfBirth: dateOfBirthObj, // Date | undefined
        gender: data.gender,
        contact: data.phone,
        phone: data.phone,
        email: data.email || "",
        address: data.address || "",
        postalCode: data.postalCode || "",
        nric: data.nric,
        emergencyContact: {
          name: data.emergencyContact?.name || "",
          relationship: data.emergencyContact?.relationship || "",
          phone: data.emergencyContact?.phone || "",
        },
        medicalHistory: {
          // Split comma-separated strings into arrays, trim whitespace
          allergies: data.medicalHistory?.allergies?.split(',').map(s => s.trim()).filter(Boolean) || [],
          // Use 'conditions' field from schema, not chronicConditions
          conditions: data.medicalHistory?.chronicConditions?.split(',').map(s => s.trim()).filter(Boolean) || [],
          // Use 'medications' field from schema, not currentMedications
          medications: data.medicalHistory?.currentMedications?.split(',').map(s => s.trim()).filter(Boolean) || [],
        }
      };

      // Check if dateOfBirthObj is required and valid
      if (cleanData.dateOfBirth === undefined) {
         console.error("Date of Birth is required or invalid.");
         toast({ title: "Error", description: "Invalid or missing Date of Birth.", variant: "destructive" });
         return; // Stop submission if undefined
      }

      console.log('Cleaned data for submission:', cleanData);
      
      // Save to Firebase
      // Type assertion is safe here because we returned early if dateOfBirth was undefined.
      // We assert that the prepared cleanData matches the expected input type for createPatient.
      const patientId = await createPatient(cleanData as Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>); 
      console.log('Patient created with ID:', patientId);

      toast({
        title: "Success",
        description: "Patient registered successfully",
      });

      // Redirect to the patient's profile
      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error('Error registering patient:', error);
      toast({
        title: "Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Link href="/patients" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Patient Registration</CardTitle>
          <CardDescription>Enter the patient&#39;s personal and medical information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log('Form validation errors:', errors);
              })} 
              className="space-y-8"
            >
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Full Name</RequiredLabel>
                        <FormControl>
                          <Input placeholder="Enter patient&apos;s full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nric"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>NRIC</RequiredLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            onChange={(e) => {
                              const formatted = formatNRIC(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Malaysian NRIC format: YYMMDD-SS-NNNN
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            disabled 
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormDescription>
                          Auto-populated from NRIC
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Gender</RequiredLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Contact Number</RequiredLabel>
                        <FormControl>
                          <Input placeholder="Enter contact number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContact.relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="Spouse" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+65 1234 5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Medical History */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Medical History</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="medicalHistory.allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea placeholder="List any known allergies" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medicalHistory.chronicConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chronic Conditions</FormLabel>
                        <FormControl>
                          <Textarea placeholder="List any chronic conditions" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medicalHistory.currentMedications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea placeholder="List current medications" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/patients">Cancel</Link>
                </Button>
                <Button type="submit">Register Patient</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}