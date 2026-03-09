"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Image as ImageIcon, Check, ChevronsUpDown, X } from "lucide-react";
import Link from "next/link";
import { IMAGING_MODALITIES } from "@/modules/pacs/types";
import { getAllPatients, type Patient } from "@/lib/fhir/patient-client";
import { ToastAction } from "@/components/ui/toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const STUDY_TO_PROCEDURE_CODE: Record<string, string> = {
  "Chest PA": "CHEST_XRAY",
  "Chest Lateral": "CHEST_XRAY_2V",
  "Abdomen": "ABDOMEN_XRAY",
  "Extremity": "KNEE_XRAY",
  "Spine": "SPINE_LUMBAR_XRAY",
};

const STUDY_TO_BODY_PART: Record<string, string> = {
  "Chest PA": "Chest",
  "Chest Lateral": "Chest",
  "Abdomen": "Abdomen",
  "Extremity": "Knee",
  "Spine": "Lumbar Spine",
};

const LAST_ORDER_TEMPLATE_KEY = "pacs-last-order-template";

export default function NewImagingOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const submitModeRef = useRef<"view" | "another">("view");
  const [submitting, setSubmitting] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [modality, setModality] = useState("");
  const [studyType, setStudyType] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [priority, setPriority] = useState("routine");
  const [indication, setIndication] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [hasLastTemplate, setHasLastTemplate] = useState(false);

  useEffect(() => {
    if (patients.length > 0) return;
    let active = true;
    setPatientsLoading(true);
    setPatientError(null);
    getAllPatients(300)
      .then((data) => {
        if (active) setPatients(data);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error loading patients:", error);
        setPatientError("Unable to load patient list.");
      })
      .finally(() => {
        if (active) setPatientsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [patients.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasLastTemplate(!!window.localStorage.getItem(LAST_ORDER_TEMPLATE_KEY));
  }, []);

  useEffect(() => {
    if (!studyType || bodyPart.trim()) return;
    const suggestedBodyPart = STUDY_TO_BODY_PART[studyType];
    if (suggestedBodyPart) setBodyPart(suggestedBodyPart);
  }, [bodyPart, studyType]);

  const filteredPatients = useMemo(() => {
    const query = patientQuery.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) =>
      [patient.fullName, patient.nric, patient.id, patient.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [patientQuery, patients]);

  const selectedModalityInfo = modality ? IMAGING_MODALITIES[modality as keyof typeof IMAGING_MODALITIES] : null;
  const supportedStudyTypes = selectedModalityInfo?.commonStudies || [];

  const applyLastOrderTemplate = () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(LAST_ORDER_TEMPLATE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        modality?: string;
        studyType?: string;
        bodyPart?: string;
        priority?: string;
        indication?: string;
        clinicalNotes?: string;
      };
      if (parsed.modality) setModality(parsed.modality);
      if (parsed.studyType) setStudyType(parsed.studyType);
      if (parsed.bodyPart) setBodyPart(parsed.bodyPart);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.indication) setIndication(parsed.indication);
      if (parsed.clinicalNotes) setClinicalNotes(parsed.clinicalNotes);
    } catch {
      // ignore corrupted template
    }
  };

  const submitWithMode = (mode: "view" | "another") => {
    submitModeRef.current = mode;
    formRef.current?.requestSubmit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!selectedPatient || !modality || !studyType || !bodyPart || !indication) {
      toast({
        title: "Missing Information",
        description: "Please select a patient and complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    const procedureCode = STUDY_TO_PROCEDURE_CODE[studyType];
    if (!procedureCode) {
      toast({
        title: "Unsupported Study Type",
        description: "Please select one of the supported X-Ray study types.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const idempotencyKey = `pacs-order-${crypto.randomUUID()}`;

    try {
      const response = await fetch("/api/imaging/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          procedures: [procedureCode],
          priority,
          clinicalIndication: indication,
          clinicalQuestion: `Study type: ${studyType}. Body part: ${bodyPart}.`,
          orderedBy: "UCC PACS",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create imaging order");
      }

      await fetch("/api/pacs/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study: {
            id: data.serviceRequestId,
            patientId: selectedPatient.id,
            patientName: selectedPatient.fullName,
            modality,
            studyType,
            bodyPart,
            status: "ordered",
            priority,
            orderedBy: "UCC PACS",
            orderedAt: new Date().toISOString(),
            indication,
            clinicalNotes,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LAST_ORDER_TEMPLATE_KEY,
          JSON.stringify({ modality, studyType, bodyPart, priority, indication, clinicalNotes })
        );
        setHasLastTemplate(true);
      }

      toast({
        title: "Order Created",
        description: `${selectedPatient.fullName} · ${studyType}`,
        action: (
          <ToastAction altText="View all studies" onClick={() => router.push("/pacs?tab=all")}>
            View All
          </ToastAction>
        ),
      });

      if (submitModeRef.current === "another") {
        setStudyType("");
        setBodyPart("");
        setPriority("routine");
        setIndication("");
        setClinicalNotes("");
        submitModeRef.current = "view";
        setSubmitting(false);
        return;
      }

      submitModeRef.current = "view";
      router.push("/pacs?tab=all");
    } catch (error) {
      console.error("Error creating imaging order:", error);
      submitModeRef.current = "view";
      toast({
        title: "Error",
        description: "Failed to create imaging order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pacs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ImageIcon aria-hidden className="h-8 w-8" />
            New Imaging Order
          </h1>
          <p className="text-muted-foreground mt-2">Order a new medical imaging study</p>
          <p className="text-xs text-muted-foreground mt-1">Fields marked with * are required.</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Select the patient for this imaging study</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-combobox">Patient Search *</Label>
              <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="patient-combobox"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={patientOpen}
                    className="w-full justify-between"
                  >
                    {selectedPatient ? `${selectedPatient.fullName} (${selectedPatient.nric || selectedPatient.id})` : "Search by name, NRIC, or patient ID..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Type patient name / NRIC..."
                      value={patientQuery}
                      onValueChange={setPatientQuery}
                    />
                    <CommandList>
                      {patientsLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Loading patients...</div>
                      ) : patientError ? (
                        <div className="px-3 py-2 text-sm text-destructive">{patientError}</div>
                      ) : (
                        <>
                          <CommandEmpty>No patients found.</CommandEmpty>
                          <CommandGroup>
                            {filteredPatients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={`${patient.fullName} ${patient.nric || ""} ${patient.id}`.toLowerCase()}
                                onSelect={() => {
                                  setSelectedPatient(patient);
                                  setPatientQuery("");
                                  setPatientOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span>{patient.fullName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {[patient.nric, patient.phone].filter(Boolean).join(" · ")}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedPatient && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground rounded-md border bg-muted/30 px-2 py-1.5">
                  <span className="font-medium text-foreground">{selectedPatient.fullName}</span>
                  <span>Patient ID: {selectedPatient.id}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setSelectedPatient(null)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Study Details</CardTitle>
            <CardDescription>Specify the imaging study to be performed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modality">Imaging Modality *</Label>
                <Select value={modality} onValueChange={setModality} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select modality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xray">
                      {IMAGING_MODALITIES.xray.name} - {IMAGING_MODALITIES.xray.description}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studyType">Study Type *</Label>
                {selectedModalityInfo ? (
                  <Select value={studyType} onValueChange={setStudyType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select study type" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedStudyTypes.map((study) => (
                        <SelectItem key={study} value={study}>
                          {study}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="studyType" placeholder="Select modality first" disabled />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyPart">Body Part / Region *</Label>
                <Input
                  id="bodyPart"
                  placeholder="e.g., Chest, Abdomen, Left Knee"
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={priority} onValueChange={setPriority} required>
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Clinical Information</CardTitle>
            <CardDescription>Provide clinical indication and relevant notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indication">Clinical Indication *</Label>
              <Textarea
                id="indication"
                placeholder="Reason for imaging study"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicalNotes">Additional Clinical Notes</Label>
              <Textarea
                id="clinicalNotes"
                placeholder="Additional clinical details"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
          {hasLastTemplate && (
            <Button type="button" variant="outline" onClick={applyLastOrderTemplate} disabled={submitting}>
              Repeat Last Order
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => submitWithMode("another")}
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Order + Another"}
          </Button>
          <Button type="button" onClick={() => submitWithMode("view")} disabled={submitting}>
            {submitting ? "Creating Order..." : "Create Imaging Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
