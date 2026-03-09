"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, TestTube } from "lucide-react";
import Link from "next/link";
import { POCT_TEST_DEFINITIONS } from "@/modules/poct/types";
import { getAllPatients, type Patient } from "@/lib/fhir/patient-client";

export default function NewPOCTOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState("");
  const inFlightSubmit = useRef(false);

  // Form state
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState<string | null>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [testType, setTestType] = useState("");
  const [urgency, setUrgency] = useState("routine");
  const [notes, setNotes] = useState("");
  const latestSearchRequest = useRef(0);

  const defaultUrgencyByTestType: Partial<Record<keyof typeof POCT_TEST_DEFINITIONS, "routine" | "urgent" | "stat">> = {
    troponin: "urgent",
    bnp: "urgent",
    covid19: "urgent",
  };

  useEffect(() => {
    if (!showPatientResults) {
      return;
    }

    const timer = setTimeout(async () => {
      if (patients.length > 0) {
        return;
      }

      const requestId = latestSearchRequest.current + 1;
      latestSearchRequest.current = requestId;
      setPatientSearchLoading(true);
      setPatientSearchError(null);

      try {
        const results = await getAllPatients(200);
        if (latestSearchRequest.current === requestId) {
          setPatients(results);
        }
      } catch (error) {
        if (latestSearchRequest.current === requestId) {
          console.error("Error loading patients:", error);
          setPatients([]);
          setPatientSearchError("Unable to load patient list.");
        }
      } finally {
        if (latestSearchRequest.current === requestId) {
          setPatientSearchLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patients.length, showPatientResults]);

  useEffect(() => {
    if (!testType) return;
    const next = defaultUrgencyByTestType[testType as keyof typeof POCT_TEST_DEFINITIONS];
    if (next) {
      setUrgency(next);
    }
  }, [testType]);

  const filteredPatientOptions = patientSearch.trim()
    ? patients.filter((patient) => {
        const query = patientSearch.toLowerCase();
        return (
          patient.fullName?.toLowerCase().includes(query) ||
          patient.nric?.toLowerCase().includes(query) ||
          patient.id?.toLowerCase().includes(query) ||
          patient.phone?.toLowerCase().includes(query)
        );
      })
    : patients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !testType) {
      toast({
        title: "Missing Information",
        description: "Please select a patient and test type.",
        variant: "destructive",
      });
      return;
    }

    if (inFlightSubmit.current) {
      return;
    }
    const idempotencyKey = lastIdempotencyKey || crypto.randomUUID();
    setLastIdempotencyKey(idempotencyKey);
    inFlightSubmit.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const selectedTestDefinition = POCT_TEST_DEFINITIONS[testType as keyof typeof POCT_TEST_DEFINITIONS];
      const payload = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        testType,
        testName: selectedTestDefinition?.name ?? testType,
        urgency,
        notes: notes.trim() || undefined,
      };
      const response = await fetch("/api/poct/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create test order");
      }
      setLastIdempotencyKey("");

      const syncedAt = data?.syncedAt ? new Date(data.syncedAt).toLocaleTimeString() : "now";
      const createdOrder = {
        id: data.id,
        patientId: payload.patientId,
        patientName: payload.patientName,
        testType: payload.testType,
        testName: payload.testName,
        status: "pending",
        orderedBy: "System User",
        orderedAt: new Date().toISOString(),
        notes: payload.notes,
        urgency: payload.urgency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("poct-order-optimistic", JSON.stringify(createdOrder));
      }
      
      toast({
        title: "Test Ordered",
        description: `${payload.patientName}: ${payload.testName} created (ID: ${data.id}). Synced at ${syncedAt}.`,
      });

      if (createAnother) {
        setTestType("");
        setNotes("");
        setUrgency("routine");
      } else {
        router.push(`/poct?createdId=${encodeURIComponent(data.id)}`);
      }
    } catch (error) {
      console.error("Error creating POCT order:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create test order. Please try again.");
      toast({
        title: "Error",
        description: "Failed to create test order. Please try again.",
        variant: "destructive",
      });
    } finally {
      inFlightSubmit.current = false;
      setSubmitting(false);
    }
  };

  const selectedTest = testType ? POCT_TEST_DEFINITIONS[testType as keyof typeof POCT_TEST_DEFINITIONS] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/poct">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            New POCT Order
          </h1>
          <p className="text-muted-foreground mt-2">
            Order a new point of care test
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Select the patient for this test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient Search *</Label>
              <div className="relative">
                <Input
                  id="patient"
                  placeholder="Search by name, NRIC, or patient ID..."
                  value={patientSearch}
                  onFocus={() => setShowPatientResults(true)}
                  onBlur={() => {
                    setTimeout(() => setShowPatientResults(false), 150);
                  }}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatient(null);
                  }}
                  autoComplete="off"
                />
                {showPatientResults && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background shadow-sm">
                    {patientSearchLoading ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Loading patients...</p>
                    ) : patientSearchError ? (
                      <p className="px-3 py-2 text-sm text-destructive">{patientSearchError}</p>
                    ) : filteredPatientOptions.length > 0 ? (
                      filteredPatientOptions.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          className="block w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            const identifier = patient.nric || patient.id;
                            setSelectedPatient(patient);
                            setPatientSearch(identifier ? `${patient.fullName} (${identifier})` : patient.fullName);
                            setShowPatientResults(false);
                          }}
                        >
                          <div className="font-medium">{patient.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {[patient.nric, patient.phone].filter(Boolean).join(" · ")}
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No patients found.</p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Start typing to search for a patient
              </p>
              {selectedPatient && (
                <p className="text-xs text-muted-foreground">
                  Selected patient ID: {selectedPatient.id}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Details */}
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
            <CardDescription>Select the test to be performed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="testType">Test Type *</Label>
                <Select value={testType} onValueChange={setTestType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(POCT_TEST_DEFINITIONS).map((test) => (
                      <SelectItem key={test.type} value={test.type}>
                        <div className="flex flex-col">
                          <span className="font-medium">{test.name}</span>
                          <span className="text-xs text-muted-foreground">{test.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTest && (
                <div className="md:col-span-2 bg-muted p-4 rounded-md space-y-2">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      <span className="capitalize">{selectedTest.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>{" "}
                      ~{selectedTest.expectedDuration} minutes
                    </div>
                    <div>
                      <span className="font-medium">Specimen:</span>{" "}
                      {selectedTest.requiresSpecimen}
                    </div>
                  </div>
                  {selectedTest.normalRange && (
                    <div className="text-sm">
                      <span className="font-medium">Normal Range:</span> {selectedTest.normalRange}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={urgency} onValueChange={setUrgency} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT (Immediate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any special instructions or relevant information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information, special requirements, or clinical notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {submitError && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-destructive">{submitError}</p>
                <Button type="submit" variant="outline" disabled={submitting}>
                  Retry Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={createAnother}
              onChange={(e) => setCreateAnother(e.target.checked)}
            />
            Create another order for same patient
          </label>
          <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating Order..." : "Create Test Order"}
          </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

