"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { FileText, Plus, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createReferral, getReferralsByPatientId, Referral } from "@/lib/models";
import { PDFViewer, pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Mock referral specialties
const specialties = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Psychiatry",
  "Ophthalmology",
];

// Mock hospitals/clinics
const facilities = [
  "General Hospital",
  "Medical Center",
  "Specialist Clinic",
  "Community Hospital",
];

interface ReferralMCSectionProps {
  patient: any; // Serialized patient from page
}

export default function ReferralMCSection({ patient }: ReferralMCSectionProps) {
  const { toast } = useToast();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showMCDialog, setShowMCDialog] = useState(false);

  // Referral form state
  const [specialty, setSpecialty] = useState<string>("");
  const [facility, setFacility] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'emergency' | "">("");
  const [reason, setReason] = useState<string>("");
  const [clinicalInfo, setClinicalInfo] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Referral | null>(null);

  const styles = useMemo(() => StyleSheet.create({
    page: { padding: 32, fontSize: 12, color: '#111827' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    body: { lineHeight: 1.5 },
  }), []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await getReferralsByPatientId(patient.id);
        if (!active) return;
        setReferrals(list.sort((a, b) => (new Date(b.date).getTime()) - (new Date(a.date).getTime())));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [patient.id]);

  const resetForm = () => {
    setSpecialty("");
    setFacility("");
    setDoctorName("");
    setUrgency("");
    setReason("");
    setClinicalInfo("");
  };

  const buildReferralText = (): string => {
    const lines: string[] = [];
    lines.push(`Referral for ${patient.fullName} (NRIC: ${patient.nric})`);
    if (patient.dateOfBirth) {
      lines.push(`Date of Birth: ${patient.dateOfBirth}`);
    }
    lines.push(`Specialty: ${specialty}`);
    lines.push(`Facility: ${facility}`);
    if (doctorName) lines.push(`Referred Doctor: ${doctorName}`);
    if (urgency) lines.push(`Urgency: ${urgency.toUpperCase()}`);
    if (reason) {
      lines.push("");
      lines.push("Reason for Referral:");
      lines.push(reason);
    }
    if (clinicalInfo) {
      lines.push("");
      lines.push("Clinical Information:");
      lines.push(clinicalInfo);
    }
    return lines.join("\n");
  };

  const handleGenerateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialty || !facility || !reason) {
      toast({
        title: "Missing information",
        description: "Please select specialty, facility and provide a reason.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      const sourceText = buildReferralText();
      const res = await fetch("/api/referral-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate letter");
      }
      const letterText: string = typeof data.letter === 'string' ? data.letter : sourceText;
      const id = await createReferral({
        patientId: patient.id,
        date: new Date(),
        specialty,
        facility,
        doctorName: doctorName || undefined,
        urgency: (urgency || undefined) as any,
        reason: reason || undefined,
        clinicalInfo: clinicalInfo || undefined,
        letterText,
      });
      // Refresh list
      const list = await getReferralsByPatientId(patient.id);
      setReferrals(list.sort((a, b) => (new Date(b.date).getTime()) - (new Date(a.date).getTime())));
      toast({ title: "Referral saved", description: "Referral letter generated and saved." });
      setShowReferralDialog(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to generate referral.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Referral Letters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Referral Letters</CardTitle>
              <CardDescription>Manage patient referrals</CardDescription>
            </div>
            <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Referral
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Generate Referral Letter</DialogTitle>
                  <DialogDescription>
                    Create a new referral letter for the patient
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleGenerateReferral}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Select value={specialty} onValueChange={setSpecialty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Referred To</Label>
                      <Select value={facility} onValueChange={setFacility}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilities.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Doctor&apos;s Name</Label>
                      <Input placeholder="Enter doctor's name (if known)" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Urgency</Label>
                      <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for Referral</Label>
                    <Textarea placeholder="Describe the reason for referral..." className="min-h-[100px]" value={reason} onChange={(e) => setReason(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinical Information</Label>
                    <Textarea placeholder="Relevant clinical information, investigations, and current treatment..." className="min-h-[150px]" value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReferralDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>{submitting ? 'Generating…' : 'Generate Referral'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading && <p className="text-muted-foreground">Loading referrals…</p>}
            {!loading && referrals.length === 0 && (
              <p className="text-muted-foreground">No referrals yet.</p>
            )}
            {!loading && referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{r.specialty} Referral</p>
                    <p className="text-sm text-muted-foreground">
                      {r.facility} - {format(new Date(r.date), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewing(r)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Certificates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Medical Certificates</CardTitle>
              <CardDescription>Issue and manage medical certificates</CardDescription>
            </div>
            <Dialog open={showMCDialog} onOpenChange={setShowMCDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New MC
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Medical Certificate</DialogTitle>
                  <DialogDescription>
                    Create a new medical certificate for the patient
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Days</Label>
                      <Input type="number" min="1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Medical reason for MC..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea
                        placeholder="Any additional notes or instructions..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMCDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Issue MC</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample MC - replace with actual data */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Medical Leave Certificate</p>
                  <p className="text-sm text-muted-foreground">
                    2 Days - {format(new Date(), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Referral Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-3xl w-[95vw] p-0 overflow-hidden">
          <div className="flex h-[85vh] flex-col">
            <DialogHeader className="px-6 py-4 border-b space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <DialogTitle>Referral Letter</DialogTitle>
                  <DialogDescription>
                    {viewing ? `${viewing.specialty} - ${viewing.facility}` : ''}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-4 flex-1 min-h-0">
              {viewing && (
                <div className="flex flex-col h-full gap-4">
                  <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                    <PDFViewer className="w-full h-full">
                      <Document>
                        <Page size="A4" style={styles.page}>
                          <View>
                            <Text style={styles.title}>Referral Letter</Text>
                            <Text style={styles.body}>{viewing.letterText}</Text>
                          </View>
                        </Page>
                      </Document>
                    </PDFViewer>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              <Button
                onClick={async () => {
                  if (!viewing) return;
                  const blob = await pdf(
                    <Document>
                      <Page size="A4" style={styles.page}>
                        <View>
                          <Text style={styles.title}>Referral Letter</Text>
                          <Text style={styles.body}>{viewing.letterText}</Text>
                        </View>
                      </Page>
                    </Document>
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `referral-${patient.id}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!viewing}
              >
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}