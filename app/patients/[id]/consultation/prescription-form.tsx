"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Prescription {
  medication: string;
  frequency: string;
  duration: string;
  instructions: string;
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

export default function PrescriptionForm() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([{
    medication: "",
    frequency: "",
    duration: "",
    instructions: "",
  }]);

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medication: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string) => {
    setPrescriptions(
      prescriptions.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Prescriptions</CardTitle>
            <CardDescription>Add medications for the patient</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addPrescription}>
            Add Medication
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label>Medication</Label>
                  <Input
                    placeholder="Medication name and strength"
                    value={prescription.medication}
                    onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
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
              </div>

              <div className="space-y-2">
                <Label>Instructions</Label>
                <Input
                  placeholder="e.g., Take with food"
                  value={prescription.instructions}
                  onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}