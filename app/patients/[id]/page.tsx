import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Activity, AlertCircle, Clock, FileText, User, FileOutput } from "lucide-react";
import Link from "next/link";
import { patients, consultations } from "@/lib/data";
import ReferralMCSection from "./referral-mc-section";

// Generate static params for all patients
export function generateStaticParams() {
  return patients.map((patient) => ({
    id: patient.id,
  }));
}

export default function PatientProfile({ params }: { params: { id: string } }) {
  const patient = patients.find(p => p.id === params.id);
  const patientConsultations = consultations[params.id as keyof typeof consultations] || [];

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.fullName}</h1>
          <p className="text-muted-foreground">NRIC: {patient.nric}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/patients/${patient.id}/consultation`}>
              New Consultation
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert for important medical info */}
      {patient.medicalHistory.allergies && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Medical Alert</AlertTitle>
          <AlertDescription>
            Allergies: {patient.medicalHistory.allergies}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Age & Gender</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}
            </div>
            <p className="text-xs text-muted-foreground">
              {patient.gender}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.lastVisit}</div>
            <p className="text-xs text-muted-foreground">
              Regular follow-up
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.upcomingAppointment || 'None'}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled appointment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="consultations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Consultations
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileOutput className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Patient's details and medical history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Contact Information</p>
                  <div className="grid gap-1">
                    <p className="text-sm">Email: {patient.email}</p>
                    <p className="text-sm">Phone: {patient.phone}</p>
                    <p className="text-sm">Address: {patient.address}</p>
                    <p className="text-sm">Postal Code: {patient.postalCode}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                  <div className="grid gap-1">
                    <p className="text-sm">Name: {patient.emergencyContact.name}</p>
                    <p className="text-sm">Relationship: {patient.emergencyContact.relationship}</p>
                    <p className="text-sm">Phone: {patient.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Medical History</p>
                <div className="grid gap-1">
                  <p className="text-sm">Chronic Conditions: {patient.medicalHistory.chronicConditions}</p>
                  <p className="text-sm">Current Medications: {patient.medicalHistory.currentMedications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultations">
          <Card>
            <CardHeader>
              <CardTitle>Consultation History</CardTitle>
              <CardDescription>Previous consultations and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              {patientConsultations.length > 0 ? (
                <div className="space-y-2">
                  {patientConsultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{consultation.type}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {consultation.date} - {consultation.doctor}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/consultations/${consultation.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No consultation records found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs History</CardTitle>
              <CardDescription>Patient's vital measurements over time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No vital signs recorded yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <ReferralMCSection patient={patient} />
        </TabsContent>
      </Tabs>
    </div>
  );
}