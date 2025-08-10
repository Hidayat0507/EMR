"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Patient, Consultation, ProcedureRecord, Prescription } from "@/lib/models";
import { formatDisplayDate } from "@/lib/utils";
import { Loader2, Download } from "lucide-react"; // For loading state
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { BillDocument } from "@/components/bill-document";

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: { patient: Patient | null; consultation: Consultation | null } | null;
}

// Helper to safely get price or return 0
const getItemPrice = (item: ProcedureRecord | Prescription): number => {
  return item?.price ?? 0;
};

export default function BillModal({ isOpen, onClose, isLoading, data }: BillModalProps) {
  const { patient, consultation } = data || {};

  const calculateTotal = (): number => {
    if (!consultation) return 0;
    const prescriptionTotal = consultation.prescriptions?.reduce((sum, item) => sum + getItemPrice(item), 0) || 0;
    const procedureTotal = consultation.procedures?.reduce((sum, item) => sum + getItemPrice(item), 0) || 0;
    return prescriptionTotal + procedureTotal;
  };

  const handleDownloadPdf = async () => {
    if (!patient || !consultation) return;
    const dataForPdf = buildBillData(patient, consultation);
    const blob = await pdf(<BillDocument data={dataForPdf} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${dataForPdf.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildBillData = (patient: Patient, consultation: Consultation) => {
    return {
      id: consultation.id || `${patient.id}-${new Date().getTime()}`,
      patientName: patient.fullName,
      date: formatDisplayDate(consultation.date || new Date()),
      prescriptions: (consultation.prescriptions || []).map((p) => ({
        name: p.medication?.name || 'Medication',
        dosage: [p.medication?.strength, p.frequency, p.duration].filter(Boolean).join(' · '),
        price: p.price ?? 0,
      })),
      procedures: (consultation.procedures || []).map((proc) => ({
        name: proc.name,
        description: proc.notes || '',
        price: proc.price ?? 0,
      })),
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] p-0 overflow-hidden">
        <div className="flex h-[85vh] flex-col">
          <DialogHeader className="px-6 py-4 border-b space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold">Invoice / Bill</DialogTitle>
                <DialogDescription>
                  {patient && consultation ? (
                    <span>
                      {patient.fullName} · {formatDisplayDate(consultation.date)}
                    </span>
                  ) : (
                    <span>Details of charges for the consultation.</span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {patient && consultation && (
                  <Button onClick={handleDownloadPdf} size="sm" disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !patient || !consultation ? (
              <div className="text-center py-10 text-muted-foreground">
                Failed to load bill details.
              </div>
            ) : (
              <div className="h-full border rounded-lg overflow-hidden">
                <PDFViewer className="w-full h-full">
                  <BillDocument data={buildBillData(patient, consultation)} />
                </PDFViewer>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 