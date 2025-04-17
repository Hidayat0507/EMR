"use client";

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Patient, Consultation } from "@/lib/models";
import { formatDisplayDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface McModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  // Pass patient and potentially consultation data
  data: { patient: Patient | null; consultation: Consultation | null } | null; 
}

export default function McModal({ isOpen, onClose, isLoading, data }: McModalProps) {
  const { patient, consultation } = data || {};

  // State for MC form fields
  const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  const [startDate, setStartDate] = useState(today);
  const [numDays, setNumDays] = useState<number>(1);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Default'); // Placeholder

  // Pre-fill diagnosis when data loads
  useEffect(() => {
    if (consultation?.diagnosis) {
      setDiagnosis(consultation.diagnosis);
    }
  }, [consultation]);

  // Updated handlePrint to open PDF in new tab for preview
  const handlePreviewPdf = () => {
    const input = document.getElementById('printable-mc-content')?.querySelector('.border'); 
    if (!input || !patient) {
        console.error("Cannot print MC: Missing content or patient data.");
        return;
    }
    console.log("Generating MC PDF...");
    html2canvas(input as HTMLElement, { scale: 2, useCORS: true })
      .then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min((pdfWidth - 80) / imgWidth, (pdfHeight - 80) / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 40;
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        
        // Open PDF in new window/tab instead of saving
        pdf.output('dataurlnewwindow');
      })
      .catch((err: any) => {
        console.error("Error generating MC PDF: ", err);
        alert("Failed to generate MC PDF.");
      });
  };

  const calculateEndDate = () => {
    if (!startDate || numDays <= 0) return 'N/A';
    const start = new Date(startDate);
    start.setDate(start.getDate() + numDays - 1); // Add days (minus 1 because start date counts as day 1)
    return formatDisplayDate(start);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg print:shadow-none print:border-none print:p-0">
        {/* Header hidden on print */}
        <DialogHeader className="print:hidden">
          <DialogTitle>Medical Certificate (MC)</DialogTitle>
          <DialogDescription>
            Generate an MC for the patient.
          </DialogDescription>
        </DialogHeader>

        {/* This div contains the content we WANT to print */}
        <div id="printable-mc-content" className="mt-4 space-y-4 print:mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-10 print:hidden">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !patient || !consultation ? (
            <div className="text-center py-10 text-muted-foreground print:hidden">
              Failed to load required data.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Form fields - hidden on print */}
              <div className="space-y-4 print:hidden">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mc-start-date">Start Date</Label>
                    <Input 
                      id="mc-start-date" 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="mc-days">Number of Days</Label>
                    <Input 
                      id="mc-days" 
                      type="number" 
                      min="1" 
                      value={numDays}
                      onChange={(e) => setNumDays(parseInt(e.target.value, 10) || 1)} 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mc-diagnosis">Diagnosis / Reason</Label>
                  <Input 
                    id="mc-diagnosis" 
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)} 
                  />
                </div>
                 <div>
                  <Label htmlFor="mc-doctor">Doctor&apos;s Name</Label>
                  <Input 
                    id="mc-doctor" 
                    value={doctorName} 
                    onChange={(e) => setDoctorName(e.target.value)} 
                  />
                </div>
              </div>

              {/* Printable MC Preview Area */}
              <div className="border rounded-md p-6 mt-4 space-y-4 print:border-none print:p-2 print:mt-0">
                <h3 className="text-center font-bold text-lg print:text-xl">MEDICAL CERTIFICATE</h3>
                <div className="text-sm print:text-base space-y-2">
                  <p><span className="font-semibold">Date Issued:</span> {formatDisplayDate(new Date())}</p>
                  <p><span className="font-semibold">Patient Name:</span> {patient.fullName}</p>
                  <p><span className="font-semibold">NRIC:</span> {patient.nric}</p>
                  <p>This is to certify that the above-named patient was seen at our clinic and is unfit for duty/school</p>
                  <p>from <span className="font-semibold">{formatDisplayDate(startDate)}</span> to <span className="font-semibold">{calculateEndDate()}</span> ({numDays} day{numDays > 1 ? 's' : ''}).</p>
                  <p><span className="font-semibold">Diagnosis:</span> {diagnosis || '(Not specified)'}</p>
                </div>
                <div className="mt-8 pt-4 border-t print:border-black">
                  <p className="text-sm print:text-base">_________________________</p>
                  <p className="text-sm print:text-base">{doctorName}</p>
                  <p className="text-xs print:text-sm">Medical Practitioner</p>
                  {/* Add clinic details here if needed */}
                </div>
              </div>
            </div>
          )}
        </div> {/* End printable content */}

        {/* Footer hidden on print */}
        <DialogFooter className="mt-6 print:hidden">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePreviewPdf} disabled={isLoading || !patient || !consultation}>
            Preview MC PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 