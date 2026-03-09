'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Consultation, Patient } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDisplayDate } from "@/lib/utils";
import { BillableConsultation, QueueStatus } from '@/lib/types';
import type { BillPayload } from "@/lib/fhir/invoice-service";
import { searchPatients, type Patient as FhirPatient } from "@/lib/fhir/patient-client";
import dynamic from "next/dynamic";
const BillModal = dynamic(() => import("@/components/billing/bill-modal"), { ssr: false });
const McModal = dynamic(() => import("@/components/mc/mc-modal"), { ssr: false });
const ReferralModal = dynamic(() => import("@/components/referrals/referral-modal"), { ssr: false });

interface OrdersClientProps {
  initialConsultations: BillableConsultation[];
}

export default function OrdersClient({ initialConsultations }: OrdersClientProps) {
  const PAGE_SIZE = 5;
  const [consultations, setConsultations] = useState<BillableConsultation[]>(initialConsultations);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [registeredPatientMatches, setRegisteredPatientMatches] = useState<FhirPatient[]>([]);
  const [searchingRegisteredPatients, setSearchingRegisteredPatients] = useState(false);
  const { toast } = useToast();

  // State for Bill Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [currentBillData, setCurrentBillData] = useState<{ patient: Patient | null; consultation: Consultation | null; bill?: BillPayload | null } | null>(null);
  const [billLoading, setBillLoading] = useState(false);

  // State for MC Modal
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [currentMcData, setCurrentMcData] = useState<{ patient: Patient | null; consultation: Consultation | null } | null>(null);
  const [mcLoading, setMcLoading] = useState(false);

  // State for Referral Modal
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [currentReferralData, setCurrentReferralData] = useState<{ patient: Patient | null; consultation: Consultation | null } | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [isMedsModalOpen, setIsMedsModalOpen] = useState(false);
  const [selectedMedsConsultation, setSelectedMedsConsultation] = useState<BillableConsultation | null>(null);

  const filteredConsultations = useMemo(() => {
    if (!searchQuery) {
      return consultations;
    }

    const searchLower = searchQuery.toLowerCase();
    return consultations.filter((consultation) => {
      return (
        consultation.patientFullName &&
        consultation.patientFullName.toLowerCase().includes(searchLower)
      );
    });
  }, [consultations, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredConsultations.length / PAGE_SIZE));
  const paginatedConsultations = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredConsultations.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredConsultations, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setRegisteredPatientMatches([]);
      setSearchingRegisteredPatients(false);
      return;
    }

    let active = true;
    setSearchingRegisteredPatients(true);
    const timeoutId = setTimeout(async () => {
      try {
        const matches = await searchPatients(term);
        if (!active) return;
        setRegisteredPatientMatches(matches);
      } catch {
        if (!active) return;
        setRegisteredPatientMatches([]);
      } finally {
        if (!active) return;
        setSearchingRegisteredPatients(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const patientsWithoutCompletedConsultation = useMemo(() => {
    if (!registeredPatientMatches.length) return [];
    const consultationPatientIds = new Set(consultations.map((consultation) => consultation.patientId));
    return registeredPatientMatches.filter((patient) => !consultationPatientIds.has(patient.id));
  }, [consultations, registeredPatientMatches]);

  const fetchDetails = async (consultationId: string, patientId: string) => {
    const res = await fetch(`/api/orders?consultationId=${consultationId}&patientId=${patientId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch details');
    }
    const data = await res.json();
    return data;
  };

  const handleGenerate = async (consultationId: string, patientId: string, type: 'Bill' | 'MC' | 'Referral') => {
    const isBill = type === 'Bill';
    const isMc = type === 'MC';
    const setLoading = isBill ? setBillLoading : isMc ? setMcLoading : setReferralLoading;
    const setCurrentData = isBill ? setCurrentBillData : isMc ? setCurrentMcData : setCurrentReferralData;
    const setModalOpen = isBill ? setIsBillModalOpen : isMc ? setIsMcModalOpen : setIsReferralModalOpen;

    setLoading(true);
    setCurrentData(null);
    setModalOpen(true);
    try {
      const { patient, consultation, bill } = await fetchDetails(consultationId, patientId);
      if (!patient || !consultation) throw new Error('Failed to fetch details.');
      if (isBill) {
        setCurrentData({ patient, consultation, bill });
      } else {
        setCurrentData({ patient, consultation });
      }
    } catch (err) {
      console.error(`Error fetching data for ${type}:`, err);
      toast({ title: `Error generating ${type}`, description: err instanceof Error ? err.message : 'Could not load details.', variant: 'destructive' });
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: QueueStatus | undefined | string) => {
    switch (status) {
      case 'meds_and_bills':
        return <Badge variant="secondary" className="bg-yellow-400 text-zinc-900 hover:bg-yellow-500">Meds & Bills</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getDispenseStatus = (consultation: BillableConsultation) => {
    const hasMeds = (consultation.prescriptions?.length || 0) > 0;
    if (!hasMeds) {
      return <Badge variant="outline">No meds</Badge>;
    }
    if (consultation.queueStatus === "completed") {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Done</Badge>;
    }
    return <Badge variant="secondary" className="bg-amber-400 text-zinc-900 hover:bg-amber-500">Pending</Badge>;
  };

  const handleMarkDispensed = async (consultation: BillableConsultation) => {
    const hasMeds = (consultation.prescriptions?.length || 0) > 0;
    if (!hasMeds || consultation.queueStatus === "completed") {
      return;
    }

    try {
      const queueRes = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: consultation.patientId,
          status: 'completed',
        }),
      });

      if (!queueRes.ok) {
        const data = await queueRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update dispense status');
      }

      setConsultations((prev) =>
        prev.map((item) =>
          item.id === consultation.id ? { ...item, queueStatus: 'completed' } : item
        )
      );
      toast({
        title: 'Dispense marked done',
        description: 'Medication dispensing has been marked as completed.',
      });
    } catch (error) {
      console.error('Failed to mark dispense done:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update dispense status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 container mx-auto py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Assistant</h1>
          <p className="text-muted-foreground">
            Track medication dispensing and mark each consult done after meds are dispensed.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication Dispensing Queue</CardTitle>
          <CardDescription>Use Mark Done once medication has been dispensed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name / NRIC..."
              className="pl-9 pr-4 py-2 w-full rounded-md border border-input bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mt-6 relative border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Consultation Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meds</TableHead>
                  <TableHead>Dispense</TableHead>
                  <TableHead className="text-right">Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConsultations.length > 0 ? (
                  paginatedConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">
                        <Link href={`/patients/${consultation.patientId}`} className="hover:underline">
                          {consultation.patientFullName || 'N/A'}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDisplayDate(consultation.date)}</TableCell>
                      <TableCell>{getStatusBadge(consultation.queueStatus)}</TableCell>
                      <TableCell>
                        {(consultation.prescriptions?.length || 0) > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setSelectedMedsConsultation(consultation);
                              setIsMedsModalOpen(true);
                            }}
                          >
                            View meds
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No meds</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5">
                          {getDispenseStatus(consultation)}
                          {(consultation.prescriptions?.length || 0) > 0 && consultation.queueStatus !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleMarkDispensed(consultation)}
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleGenerate(consultation.id!, consultation.patientId, 'Bill')}>
                            Bill
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGenerate(consultation.id!, consultation.patientId, 'MC')}>
                            MC
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGenerate(consultation.id!, consultation.patientId, 'Referral')}>
                            Referral
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No billable consultations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredConsultations.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-
                {Math.min(currentPage * PAGE_SIZE, filteredConsultations.length)} of {filteredConsultations.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {searchQuery.trim().length >= 2 && (
            <div className="mt-4 border rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium">Registered Patient Matches</div>
              {searchingRegisteredPatients ? (
                <p className="text-sm text-muted-foreground">Searching registered patients...</p>
              ) : patientsWithoutCompletedConsultation.length > 0 ? (
                <div className="space-y-1">
                  {patientsWithoutCompletedConsultation.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between text-sm">
                      <Link href={`/patients/${patient.id}`} className="hover:underline font-medium">
                        {patient.fullName}
                      </Link>
                      <span className="text-muted-foreground">
                        Registered only (no completed consultation yet)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No additional registered patients found for this search.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        isLoading={billLoading}
        data={currentBillData}
      />

      <McModal
        isOpen={isMcModalOpen}
        onClose={() => setIsMcModalOpen(false)}
        isLoading={mcLoading}
        data={currentMcData}
      />

      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        isLoading={referralLoading}
        data={currentReferralData}
      />

      <Dialog open={isMedsModalOpen} onOpenChange={setIsMedsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Prescribed Medications{selectedMedsConsultation?.patientFullName ? ` - ${selectedMedsConsultation.patientFullName}` : ""}
            </DialogTitle>
            <DialogDescription>
              Review prescribed medications and dosing instructions for this consultation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedMedsConsultation?.prescriptions?.length ? (
              selectedMedsConsultation.prescriptions.map((prescription, index) => (
                <div key={`${prescription.medication?.id || prescription.medication?.name || 'med'}-${index}`} className="rounded-md border p-2">
                  <div className="text-sm font-medium">{prescription.medication?.name || "Medication"}</div>
                  <div className="text-xs text-muted-foreground">
                    {[
                      prescription.frequency ? `Frequency: ${prescription.frequency}` : "",
                      prescription.duration ? `Duration: ${prescription.duration}` : "",
                    ]
                      .filter(Boolean)
                      .join(" | ") || "No dosing instructions"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No medications recorded for this consultation.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
