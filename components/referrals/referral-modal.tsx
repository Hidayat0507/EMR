"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Consultation, Patient } from "@/lib/models";
import { formatDisplayDate } from "@/lib/utils";
import { Loader2, Download } from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import ReferralDocument from "@/components/referrals/referral-document";
import { fetchOrganizationDetails, type OrganizationDetails } from "@/lib/org";
import { saveReferral } from "@/lib/fhir/referral-client";
import { useToast } from "@/components/ui/use-toast";

const SPECIALTIES = [
  "General",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Psychiatry",
  "Ophthalmology",
];

const FACILITIES = [
  "General Hospital",
  "Medical Center",
  "Specialist Clinic",
  "Community Hospital",
];

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: { patient: Patient | null; consultation: Consultation | null } | null;
}

function formatDateLabel(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createSourceText(patient: Patient, consultation: Consultation): string {
  const lines: string[] = [];
  lines.push(`Referral for ${patient.fullName} (NRIC: ${patient.nric})`);
  if (patient.dateOfBirth) {
    lines.push(`Date of Birth: ${formatDisplayDate(patient.dateOfBirth)}`);
  }
  if (consultation.chiefComplaint) {
    lines.push("");
    lines.push("Chief Complaint:");
    lines.push(consultation.chiefComplaint);
  }
  if (consultation.diagnosis) {
    lines.push("");
    lines.push("Diagnosis:");
    lines.push(consultation.diagnosis);
  }
  if (consultation.notes) {
    lines.push("");
    lines.push("Clinical Notes:");
    lines.push(consultation.notes);
  }
  return lines.join("\n");
}

export default function ReferralModal({ isOpen, onClose, isLoading, data }: ReferralModalProps) {
  const { patient, consultation } = data || {};
  const { toast } = useToast();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);

  const [toField, setToField] = useState("");
  const [fromField, setFromField] = useState("");
  const [specialty, setSpecialty] = useState("General");
  const [facility, setFacility] = useState("General Hospital");
  const [reason, setReason] = useState("");
  const [letterText, setLetterText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setOrgLoading(true);
    fetchOrganizationDetails()
      .then((info) => {
        if (!active) return;
        setOrganization(info);
        setOrgLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setOrgLoaded(true);
      })
      .finally(() => {
        if (!active) return;
        setOrgLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !patient || !consultation) return;
    const defaultFrom = organization?.name || "";
    const defaultTo = consultation.type ? `${consultation.type} Department` : "";
    setFromField(defaultFrom);
    setToField(defaultTo);
    setSpecialty("General");
    setFacility("General Hospital");
    setReason(consultation.chiefComplaint || consultation.diagnosis || "Clinical evaluation");
    setLetterText(createSourceText(patient, consultation));
  }, [isOpen, patient, consultation, organization?.name]);

  const ensureOrganizationDetails = async (): Promise<OrganizationDetails | null> => {
    if (orgLoaded) return organization;
    setOrgLoading(true);
    try {
      const info = await fetchOrganizationDetails();
      setOrganization(info);
      setOrgLoaded(true);
      return info;
    } finally {
      setOrgLoading(false);
    }
  };

  const handleSaveReferral = async () => {
    if (!patient || !consultation || !letterText.trim()) return;
    if (!specialty || !facility || !reason.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill specialty, facility, and reason.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveReferral({
        patientId: patient.id,
        date: new Date(),
        specialty,
        facility,
        reason: reason.trim(),
        letterText,
        clinicalInfo: createSourceText(patient, consultation),
      });
      toast({ title: "Referral saved", description: "Referral saved successfully." });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Failed to save referral.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!patient || !letterText.trim()) return;
    const orgInfo = await ensureOrganizationDetails();
    const blob = await pdf(
      <ReferralDocument
        letterText={letterText}
        organization={orgInfo}
        metadata={{
          dateLabel: formatDateLabel(new Date()),
          toLine: toField || null,
          fromLine: fromField || null,
          patientName: patient.fullName || null,
          patientId: patient.nric || null,
          patientDateOfBirth: formatDateLabel(patient.dateOfBirth),
          patientPhone: patient.phone || null,
          patientEmail: patient.email || null,
          specialty,
          facility,
        }}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referral-${patient.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewMetadata = useMemo(
    () => ({
      dateLabel: formatDateLabel(new Date()),
      toLine: toField || null,
      fromLine: fromField || null,
      patientName: patient?.fullName || null,
      patientId: patient?.nric || null,
      patientDateOfBirth: formatDateLabel(patient?.dateOfBirth),
      patientPhone: patient?.phone || null,
      patientEmail: patient?.email || null,
      specialty,
      facility,
    }),
    [facility, fromField, patient?.dateOfBirth, patient?.email, patient?.fullName, patient?.nric, patient?.phone, specialty, toField]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 overflow-hidden">
        <div className="flex h-[88vh] flex-col">
          <DialogHeader className="px-6 py-4 border-b space-y-2">
            <DialogTitle>Referral Letter</DialogTitle>
            <DialogDescription>
              {patient ? `Generate referral for ${patient.fullName}` : "Generate referral letter."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !patient || !consultation ? (
              <div className="text-center py-10 text-muted-foreground">
                Failed to load required data.
              </div>
            ) : (
              <div className="h-full grid gap-4 md:grid-cols-2">
                <div className="space-y-3 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Specialty</Label>
                      <Select value={specialty} onValueChange={setSpecialty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Facility</Label>
                      <Select value={facility} onValueChange={setFacility}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                        <SelectContent>
                          {FACILITIES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>To</Label>
                    <Input value={toField} onChange={(event) => setToField(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>From</Label>
                    <Input value={fromField} onChange={(event) => setFromField(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Reason</Label>
                    <Input value={reason} onChange={(event) => setReason(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Letter Content</Label>
                    <Textarea
                      value={letterText}
                      onChange={(event) => setLetterText(event.target.value)}
                      className="min-h-[320px]"
                    />
                  </div>
                </div>

                <div className="h-full border rounded-lg overflow-hidden">
                  {letterText.trim() ? (
                    <PDFViewer className="w-full h-full">
                      <ReferralDocument
                        letterText={letterText}
                        organization={organization}
                        metadata={previewMetadata}
                      />
                    </PDFViewer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Letter preview will appear here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveReferral}
              disabled={isLoading || !patient || !consultation || !letterText.trim() || saving}
            >
              {saving ? "Saving..." : "Save Referral"}
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={
                isLoading ||
                !patient ||
                !consultation ||
                !letterText.trim() ||
                (orgLoading && !orgLoaded)
              }
            >
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

