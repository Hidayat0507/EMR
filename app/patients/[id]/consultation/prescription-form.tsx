"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Prescription } from "@/lib/models";
import { MedicationSearch } from "@/components/medication-search";

interface PrescriptionFormProps {
  initialPrescriptions?: Prescription[];
  onPrescriptionsChange: (prescriptions: Prescription[]) => void;
}

const frequencies = [
  { value: "od", label: "Once daily" },
  { value: "bd", label: "Twice daily" },
  { value: "tds", label: "Three times daily" },
  { value: "qds", label: "Four times daily" },
  { value: "prn", label: "As needed" },
];

const durations = [
  { value: "3d", label: "3 days" },
  { value: "5d", label: "5 days" },
  { value: "1w", label: "1 week" },
  { value: "2w", label: "2 weeks" },
  { value: "1m", label: "1 month" },
];

export default function PrescriptionForm({ 
  initialPrescriptions = [],
  onPrescriptionsChange 
}: PrescriptionFormProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);

  useEffect(() => {
    onPrescriptionsChange(prescriptions);
  }, [prescriptions, onPrescriptionsChange]);

  const handleAddPrescription = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPrescriptions([
      ...prescriptions,
      { medication: { id: `temp-med-${Date.now()}`, name: "" }, frequency: "", duration: "" },
    ]);
  };

  const handleRemovePrescription = (indexToRemove: number) => {
    setPrescriptions(prescriptions.filter((_, index) => index !== indexToRemove));
  };

  const updatePrescription = (index: number, field: keyof Prescription | 'medication.name' | 'medication', value: any) => {
    setPrescriptions(
      prescriptions.map((p, i) => {
        if (i === index) {
          if (field === 'medication') {
            return { ...p, medication: value };
          } else if (field === 'medication.name') {
            return { ...p, medication: { ...p.medication, name: value } };
          } else if (field === 'frequency' || field === 'duration') {
            return { ...p, [field]: value };
          }
        }
        return p;
      })
    );
  };

  return (
    <div>
      {prescriptions.map((prescription, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <div className="col-span-5">
            <MedicationSearch
              selectedMedication={
                prescription.medication.id && prescription.medication.name
                  ? {
                      value: prescription.medication.id,
                      label: prescription.medication.name
                    }
                  : null
              }
              onSelectMedication={(selected) => {
                if (selected) {
                  updatePrescription(index, 'medication', {
                    id: selected.value,
                    name: selected.label.split(' (')[0]
                  });
                } else {
                  updatePrescription(index, 'medication', { id: "", name: "" });
                }
              }}
            />
          </div>

          <div className="col-span-3">
            <Select
              value={prescription.frequency}
              onValueChange={(value) => updatePrescription(index, 'frequency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-3">
            <Select
              value={prescription.duration}
              onValueChange={(value) => updatePrescription(index, 'duration', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {durations.map((dur) => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-1 flex justify-end">
            <Button 
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => handleRemovePrescription(index)}
              className="text-muted-foreground hover:text-destructive h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      <Button 
        onClick={handleAddPrescription}
        variant="outline" 
        size="sm"
        type="button"
        className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Medication
      </Button>
    </div>
  );
}