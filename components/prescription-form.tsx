"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MedicationSearch } from "@/components/medication-search";
import { Prescription } from "@/lib/models";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { parse, format } from 'date-fns';

interface MedicationOption {
  value: string;
  label: string;
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

interface PrescriptionFormProps {
  onPrescriptionsChange?: (prescriptions: Prescription[]) => void;
  prescriptions?: Prescription[];
}

export default function PrescriptionForm({ 
  onPrescriptionsChange, 
  prescriptions: initialPrescriptions 
}: PrescriptionFormProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(
    initialPrescriptions?.length 
      ? initialPrescriptions 
      : [{
          medication: { id: "", name: "" }, 
          frequency: "",
          duration: "",
          expiryDate: "",
        }]
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (onPrescriptionsChange) {
      onPrescriptionsChange(prescriptions);
    }
  }, [prescriptions, onPrescriptionsChange]);

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { 
        medication: { id: "", name: "" },
        frequency: "",
        duration: "",
        expiryDate: ""
      },
    ]);
  };

  const removePrescription = (index: number) => {
    const newPrescriptions = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(newPrescriptions);
  };

  const updatePrescription = (
    index: number,
    field: keyof Omit<Prescription, 'medication'> | 'medication',
    value: string | Prescription['medication'] | Date | undefined
  ) => {
    const newPrescriptions = prescriptions.map((p, i) => {
      if (i === index) {
        if (field === 'medication') {
          if (typeof value === 'object' && value !== null && 'id' in value && 'name' in value) {
            return { ...p, medication: value };
          }
          console.error("Incorrect value type for medication update:", value);
          return p;
        } else if (field === 'frequency' || field === 'duration') {
          if (typeof value === 'string') {
            return { ...p, [field]: value };
          }
        } else if (field === 'expiryDate') {
          if (value instanceof Date) {
            return { ...p, expiryDate: format(value, 'yyyy-MM-dd') };
          } else if (value === undefined) {
            return { ...p, expiryDate: "" };
          } else if (typeof value === 'string') {
            return { ...p, expiryDate: value };
          }
          console.error(`Incorrect value type for ${field} update:`, value);
          return p;
        }
      }
      return p;
    });
    setPrescriptions(newPrescriptions);
  };

  const parseDateString = (dateString: string | undefined): Date | undefined => {
    if (!dateString) return undefined;
    try {
      return parse(dateString, 'yyyy-MM-dd', new Date());
    } catch (e) {
      console.error("Error parsing date string:", e);
      return undefined;
    }
  };

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" onClick={addPrescription}>
        Add Medication
      </Button>

      {prescriptions.map((prescription, index) => (
        <div key={index} className="relative space-y-4 p-4 border rounded-lg">
          {prescriptions.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={() => removePrescription(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <Label>Medication</Label>
              <MedicationSearch 
                selectedMedication={
                  prescription.medication.id ? {
                    value: prescription.medication.id,
                    label: prescription.medication.name + (prescription.medication.strength ? ` (${prescription.medication.strength})` : '')
                  } : null
                }
                onSelectMedication={(selectedOption: MedicationOption | null) => {
                  if (selectedOption) {
                    const nameParts = selectedOption.label.split(' (');
                    const selectedName = nameParts[0];
                    
                    updatePrescription(index, 'medication', {
                      id: selectedOption.value,
                      name: selectedName,
                    });
                  } else {
                    updatePrescription(index, 'medication', { id: "", name: "" });
                  }
                }}
              />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select
                value={prescription.frequency}
                onValueChange={(value) => updatePrescription(index, 'frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
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
            <div>
              <Label>Duration</Label>
              <Select
                value={prescription.duration}
                onValueChange={(value) => updatePrescription(index, 'duration', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
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
            <div>
              <Label htmlFor={`expiryDate-${index}`}>Expiry Date</Label>
              {isMounted && (
                <DatePicker 
                  date={parseDateString(prescription.expiryDate)}
                  setDate={(date) => updatePrescription(index, 'expiryDate', date)}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}