'use client';

import { useState, useMemo } from 'react';
import { Patient, Consultation, getConsultationById, getPatientById } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/utils";
import { BillableConsultation, QueueStatus } from '@/lib/types';
import BillModal from "@/components/billing/bill-modal";
import McModal from "@/components/mc/mc-modal";

interface OrdersClientProps {
  initialConsultations: BillableConsultation[];
}

export default function OrdersClient({ initialConsultations }: OrdersClientProps) {
  const [consultations] = useState<BillableConsultation[]>(initialConsultations);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // State for Bill Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [currentBillData, setCurrentBillData] = useState<{ patient: Patient | null; consultation: Consultation | null } | null>(null);
  const [billLoading, setBillLoading] = useState(false);

  // State for MC Modal
  const [isMcModalOpen, setIsMcModalOpen] = useState(false);
  const [currentMcData, setCurrentMcData] = useState<{ patient: Patient | null; consultation: Consultation | null } | null>(null);
  const [mcLoading, setMcLoading] = useState(false);

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

  const handleGenerate = async (consultationId: string, patientId: string, type: 'Bill' | 'MC' | 'Referral') => {
    if (type === 'Bill') {
      setBillLoading(true);
      setCurrentBillData(null);
      setIsBillModalOpen(true);
      try {
        const [patientData, consultationData] = await Promise.all([
          getPatientById(patientId),
          getConsultationById(consultationId)
        ]);
        if (!patientData || !consultationData) throw new Error('Failed to fetch details.');
        setCurrentBillData({ patient: patientData, consultation: consultationData });
      } catch (err) {
        console.error(`Error fetching data for ${type}:`, err);
        toast({ title: `Error generating ${type}`, description: err instanceof Error ? err.message : 'Could not load details.', variant: 'destructive' });
        setIsBillModalOpen(false);
      } finally {
        setBillLoading(false);
      }
    } else if (type === 'MC') {
      setMcLoading(true);
      setCurrentMcData(null);
      setIsMcModalOpen(true);
      try {
        const [patientData, consultationData] = await Promise.all([
          getPatientById(patientId),
          getConsultationById(consultationId)
        ]);
        if (!patientData || !consultationData) throw new Error('Failed to fetch details for MC.');
        setCurrentMcData({ patient: patientData, consultation: consultationData });
      } catch (err) {
        console.error(`Error fetching data for ${type}:`, err);
        toast({ title: `Error generating ${type}`, description: err instanceof Error ? err.message : 'Could not load details.', variant: 'destructive' });
        setIsMcModalOpen(false);
      } finally {
        setMcLoading(false);
      }
    } else if (type === 'Referral') {
      console.log(`Generating ${type} for consultation ${consultationId}, patient ${patientId}`);
      toast({ title: `Generating ${type}... (Not implemented)` });
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

  return (
    <div className="space-y-6 container mx-auto py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Documents</h1>
          <p className="text-muted-foreground">
            Generate bills, MCs, and referral letters for completed consultations.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Consultations</CardTitle>
          <CardDescription>Select a consultation to generate documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name..."
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.length > 0 ? (
                  filteredConsultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">
                        <Link href={`/patients/${consultation.patientId}`} className="hover:underline">
                          {consultation.patientFullName || 'N/A'}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDisplayDate(consultation.date)}</TableCell>
                      <TableCell>{getStatusBadge(consultation.queueStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleGenerate(consultation.id!, consultation.patientId, 'Bill')}>
                              Generate Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleGenerate(consultation.id!, consultation.patientId, 'MC')}>
                              Generate MC
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleGenerate(consultation.id!, consultation.patientId, 'Referral')}>
                              Generate Referral
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No billable consultations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
    </div>
  );
} 