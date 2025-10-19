"use client";

import { useState, useEffect, useMemo, useCallback, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPatientById, Prescription, ProcedureRecord, createConsultation, updateConsultation } from "@/lib/models";
import { updateQueueStatus } from "@/lib/actions";
import { safeToISOString } from "@/lib/utils";
import { OrderComposer } from "@/components/orders/order-composer";
import { PatientCard, SerializedPatient } from "@/components/patients/patient-card";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getProcedures } from "@/lib/procedures";
import SoapRewriteButton from "./soap-rewrite-button";
import ReferralLetterButton from "./referral-letter-button";
import { executeSmartTextCommand, type SmartTextContext } from "@/lib/smart-text";
import type { SerializedConsultation } from "@/lib/types";

// Load procedures from DB

interface ConsultationFormProps {
  patientId: string;
  initialPatient?: SerializedPatient;
  initialConsultation?: SerializedConsultation | null;
}

export default function ConsultationForm({
  patientId,
  initialPatient,
  initialConsultation = null,
}: ConsultationFormProps) {
  const [patient, setPatient] = useState<SerializedPatient | null>(initialPatient ?? null);
  const [loading, setLoading] = useState(!initialPatient);
  const isEditMode = Boolean(initialConsultation?.id);
  const [smartTextState, setSmartTextState] = useState<{
    field: string;
    command: string;
    status: "loading" | "success" | "error";
    message?: string;
  } | null>(null);
  
  // Form state
  const [clinicalNotes, setClinicalNotes] = useState(initialConsultation?.chiefComplaint ?? "");
  const [diagnosis, setDiagnosis] = useState(initialConsultation?.diagnosis ?? "");
  const [procedureEntries, setProcedureEntries] = useState<ProcedureRecord[]>(
    initialConsultation?.procedures ? [...initialConsultation.procedures] : []
  );
  const [additionalNotes, setAdditionalNotes] = useState(initialConsultation?.notes ?? "");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(
    initialConsultation?.prescriptions ? [...initialConsultation.prescriptions] : []
  );
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // If we already have initial patient for this id, skip fetching
    if (initialPatient && initialPatient.id === patientId) {
      setLoading(false);
      return;
    }
    let isActive = true;
    async function loadPatient() {
      try {
        const patientData = await getPatientById(patientId);
        if (!isActive) return;
        if (patientData) {
          const serializedPatient: SerializedPatient = {
            ...patientData,
            dateOfBirth: safeToISOString(patientData.dateOfBirth),
            lastVisit: safeToISOString(patientData.lastVisit),
            upcomingAppointment: safeToISOString(patientData.upcomingAppointment),
            createdAt: safeToISOString(patientData.createdAt),
            updatedAt: safeToISOString(patientData.updatedAt),
            queueAddedAt: safeToISOString(patientData.queueAddedAt),
          };
          setPatient(serializedPatient);
        } else {
          setPatient(null);
        }
      } catch (error) {
        console.error('Error loading patient:', error);
      } finally {
        if (isActive) setLoading(false);
      }
    }
    loadPatient();
    return () => {
      isActive = false;
    };
  }, [patientId, initialPatient]);

  // Procedures managed by OrderComposer
  const [procedureOptions, setProcedureOptions] = useState<{ id: string; label: string; price?: number; codingSystem?: string; codingCode?: string; codingDisplay?: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getProcedures();
        setProcedureOptions(list.map(p => ({ id: p.id, label: p.name, price: p.defaultPrice, codingSystem: p.codingSystem, codingCode: p.codingCode, codingDisplay: p.codingDisplay })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const smartTextContext = useMemo<SmartTextContext>(
    () => ({
      patientId: patient?.id ?? patientId,
      patient,
    }),
    [patientId, patient]
  );

  useEffect(() => {
    if (!smartTextState || smartTextState.status === "loading") {
      return;
    }

    const timeout = window.setTimeout(
      () => setSmartTextState(null),
      smartTextState.status === "error" ? 6000 : 4000
    );

    return () => window.clearTimeout(timeout);
  }, [smartTextState]);

  const smartTextMessage = useCallback(
    (field: string) => {
      if (!smartTextState || smartTextState.field !== field) {
        return null;
      }

      const tone =
        smartTextState.status === "error"
          ? "text-destructive"
          : smartTextState.status === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground";

      const text =
        smartTextState.status === "loading"
          ? `Smart text ${smartTextState.command} generating…`
          : smartTextState.message ?? "Smart text updated.";

      return <p className={`text-xs ${tone}`}>{text}</p>;
    },
    [smartTextState]
  );

  const handleSmartTextKeyDown = useCallback(
    (field: string, setter: (value: string) => void) =>
      async (event: KeyboardEvent<HTMLTextAreaElement>) => {
        const triggerKeys = new Set([" ", "Enter", "Tab"]);
        if (!triggerKeys.has(event.key)) {
          return;
        }

        const textarea = event.currentTarget;
        const selectionStart = textarea.selectionStart ?? 0;
        const selectionEnd = textarea.selectionEnd ?? 0;

        if (selectionStart !== selectionEnd) {
          return;
        }

        const currentValue = textarea.value;
        const preceding = currentValue.slice(0, selectionStart);
        const match = preceding.match(/(?:^|\s)(\.[a-zA-Z0-9_-]+)$/);

        if (!match) {
          return;
        }

        const commandKey = match[1].toLowerCase();
        const startIndex = selectionStart - commandKey.length;

        if (startIndex < 0) {
          return;
        }

        event.preventDefault();
        const triggerKey = event.key;

        setSmartTextState({
          field,
          command: commandKey,
          status: "loading",
        });

        try {
          const result = await executeSmartTextCommand(commandKey, smartTextContext);

          if (!result) {
            setSmartTextState({
              field,
              command: commandKey,
              status: "error",
              message: "Unknown smart text command.",
            });
            return;
          }

          const trailing = triggerKey === "Enter" ? "\n" : triggerKey === " " ? " " : "";
          const before = currentValue.slice(0, startIndex);
          const after = currentValue.slice(selectionEnd);
          const nextValue = `${before}${result.text}${trailing}${after}`;

          setter(nextValue);

          const cursor = before.length + result.text.length + trailing.length;
          requestAnimationFrame(() => {
            textarea.selectionStart = cursor;
            textarea.selectionEnd = cursor;
          });

          setSmartTextState({
            field,
            command: commandKey,
            status: "success",
            message: result.meta ?? "Smart text inserted.",
          });
        } catch (error) {
          console.error("Smart text insertion failed:", error);
          setSmartTextState({
            field,
            command: commandKey,
            status: "error",
            message: "Failed to insert smart text. Try again.",
          });
        }
      },
    [smartTextContext]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    // Validate form
    if (!clinicalNotes.trim() || !diagnosis.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in Chief Complaint and Diagnosis",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const consultationData = {
        chiefComplaint: clinicalNotes,
        diagnosis,
        procedures: procedureEntries, // From order composer
        notes: additionalNotes,
        prescriptions: prescriptions // Assuming prescriptions state already holds objects with price?
      };

      if (isEditMode && initialConsultation?.id) {
        await updateConsultation(initialConsultation.id, consultationData);
        toast({
          title: "Consultation Updated",
          description: "Your changes have been saved.",
        });
        router.push(`/patients/${patientId}`);
        return;
      }

      const newConsultationId = await createConsultation({
        patientId,
        date: new Date(), // Consider using server timestamp later
        ...consultationData,
      });

      if (!newConsultationId) {
        throw new Error("Failed to save consultation");
      }

      // Update queue status AFTER successful consultation save
      await updateQueueStatus(patientId, "meds_and_bills");

      toast({
        title: "Consultation Saved",
        description: "Consultation has been successfully recorded.",
      });

      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error",
        description: "Failed to save consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="p-6">Patient not found</div>;
  }

  return (
    <div className="container max-w-7xl py-6">
      <div className="mb-6">
        <Link
          href={`/patients/${patientId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient Profile
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          {isEditMode ? "Edit Consultation" : "New Consultation"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Update the consultation notes and orders below."
            : "Record the patient's consultation details below."}
        </p>
      </div>

      {/* Consultation Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          {/* Left: Patient Details */}
          <div className="md:col-span-3 space-y-2 sticky top-2 self-start">
            {patient && <PatientCard patient={patient} compact />}
          </div>

          {/* Middle: Chief Complaint & Diagnosis (largest column) */}
          <div className="md:col-span-6 space-y-3">
            <div className="space-y-1">
              <Textarea
                placeholder="Clinical notes"
                className="min-h-[200px]"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                onKeyDown={handleSmartTextKeyDown("clinicalNotes", setClinicalNotes)}
              />
              {smartTextMessage("clinicalNotes")}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SoapRewriteButton
                sourceText={clinicalNotes}
                onInsert={(soapNote) => setClinicalNotes(soapNote)}
              />
              <ReferralLetterButton
                sourceText={[clinicalNotes, diagnosis, additionalNotes].filter(Boolean).join("\n\n")}
                patient={patient}
              />
            </div>
            <Input
              placeholder="Condition (diagnosis)"
              className="mt-2"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
            <div className="space-y-1">
              <Textarea
                placeholder="Additional notes"
                className="min-h-[160px]"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                onKeyDown={handleSmartTextKeyDown("additionalNotes", setAdditionalNotes)}
              />
              {smartTextMessage("additionalNotes")}
            </div>
          </div>

          {/* Right: Orders (Meds + Procedures) */}
          <div className="md:col-span-3 space-y-2 sticky top-2 self-start">
            <OrderComposer
              procedureOptions={procedureOptions}
              initialPrescriptions={prescriptions}
              initialProcedures={procedureEntries}
              onPrescriptionsChange={setPrescriptions}
              onProceduresChange={setProcedureEntries}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" asChild>
            <Link href={`/patients/${patientId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (isEditMode ? "Updating..." : "Saving...") : isEditMode ? "Update Consultation" : "Sign Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
