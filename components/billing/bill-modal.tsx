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
import { Loader2 } from "lucide-react"; // For loading state
import jsPDF from 'jspdf'; // Import jsPDF
import html2canvas from 'html2canvas'; // Import html2canvas

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

  // Updated handlePrint to open PDF in new tab for preview
  const handlePreviewPdf = () => {
    const input = document.getElementById('printable-bill-content');
    if (!input || !patient || !consultation) {
      console.error("Cannot print: Missing content, patient, or consultation data.");
      return;
    }
    console.log("Generating Bill PDF...");
    html2canvas(input, { scale: 2, useCORS: true })
      .then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min((pdfWidth - 80) / imgWidth, (pdfHeight - 80) / imgHeight); // 40pt margin
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 40;
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Open PDF in new window/tab instead of saving
        pdf.output('dataurlnewwindow');
      })
      .catch((err: any) => {
        console.error("Error generating Bill PDF: ", err);
        alert("Failed to generate Bill PDF.");
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="text-2xl font-bold">Invoice / Bill</DialogTitle>
          <DialogDescription>
            Details of charges for the consultation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div id="printable-bill-content" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !patient || !consultation ? (
              <div className="text-center py-10 text-muted-foreground">
                Failed to load bill details.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Details */}
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-32">Name:</span>
                      <span className="font-medium">{patient.fullName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-32">NRIC:</span>
                      <span className="font-medium">{patient.nric}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-32">Consultation Date:</span>
                      <span className="font-medium">{formatDisplayDate(consultation.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Procedures */}
                {consultation.procedures && consultation.procedures.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Procedures</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[70%]">Procedure</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {consultation.procedures.map((proc, index) => (
                            <TableRow key={`proc-${index}`}>
                              <TableCell className="font-medium">{proc.name}</TableCell>
                              <TableCell className="text-right">${getItemPrice(proc).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Prescriptions */}
                {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Medications</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Medication</TableHead>
                            <TableHead className="w-[30%]">Strength</TableHead>
                            <TableHead className="text-right">Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {consultation.prescriptions.map((pres, index) => (
                            <TableRow key={`pres-${index}`}>
                              <TableCell className="font-medium">{pres.medication.name}</TableCell>
                              <TableCell>{pres.medication.strength || 'N/A'}</TableCell>
                              <TableCell className="text-right">${getItemPrice(pres).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {/* Total Amount */}
                <div className="flex justify-end items-center pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-none border-t pt-4 mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePreviewPdf} disabled={isLoading || !patient || !consultation}>
            Preview Bill PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 