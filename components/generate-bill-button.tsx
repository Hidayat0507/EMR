'use client';

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Document, Page, PDFViewer, pdf } from '@react-pdf/renderer';
import { BillDocument } from './bill-document';

interface GenerateBillButtonProps {
  patientData: any; // Replace 'any' with your patient data type
}

export function GenerateBillButton({ patientData }: GenerateBillButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    try {
      setIsLoading(true);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate bill PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await pdf(<BillDocument data={patientData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-${patientData.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogTrigger asChild>
        <Button
          onClick={handleGeneratePDF}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          {isLoading ? "Generating..." : "Generate Bill PDF"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
          <DialogDescription>
            Preview the bill before downloading
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 w-full h-full min-h-[60vh]">
          <PDFViewer width="100%" height="100%" className="rounded-md">
            <BillDocument data={patientData} />
          </PDFViewer>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleDownload}>
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
