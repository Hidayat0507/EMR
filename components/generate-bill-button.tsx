'use client';

import { Button } from "@/components/ui/button";
import { FileDown, Download } from "lucide-react";
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
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle>Bill Preview</DialogTitle>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
          <div className="flex-1 overflow-auto border rounded-lg">
            <PDFViewer className="w-full h-full">
              <BillDocument data={patientData} />
            </PDFViewer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
