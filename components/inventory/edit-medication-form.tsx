import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Medication } from "@/lib/inventory";
import { MEDICATION_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

const parseStrengths = (value: string) =>
  value
    .split(/[,|;]/)
    .map((token) => token.trim())
    .filter(Boolean);

interface EditMedicationFormProps {
  medication: Medication;
  onSubmit: (data: Partial<Medication>) => Promise<void>;
  onCancel: () => void;
}

export function EditMedicationForm({ medication, onSubmit, onCancel }: EditMedicationFormProps) {
  const { toast } = useToast();
  const [category, setCategory] = React.useState(medication.category);
  const [strengthsInput, setStrengthsInput] = React.useState(medication.strengths?.join(" | ") ?? "");
  const [unit, setUnit] = React.useState(medication.unit || "tablet");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!category) {
      toast({
        variant: "destructive",
        title: "Missing category",
        description: "Please select a category before saving.",
      });
      return;
    }
    
    const medicationData: Partial<Medication> = {
      name: formData.get('name') as string,
      category,
      dosageForm: formData.get('dosageForm') as string,
      strengths: parseStrengths(strengthsInput),
      stock: parseInt(formData.get('stock') as string),
      minimumStock: parseInt(formData.get('minimumStock') as string),
      unit,
      expiryDate: formData.get('expiryDate') as string,
      unitPrice: parseFloat(formData.get('unitPrice') as string),
    };

    await onSubmit(medicationData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Medication Name</Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={medication.name}
            placeholder="Enter medication name" 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {MEDICATION_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="strengths">Strengths</Label>
          <Input
            id="strengths"
            value={strengthsInput}
            onChange={(e) => setStrengthsInput(e.target.value)}
            placeholder="e.g. 500mg | 1g"
          />
          <p className="text-xs text-muted-foreground">Separate multiple strengths with commas or |</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dosageForm">Dosage Form</Label>
          <Input 
            id="dosageForm" 
            name="dosageForm" 
            defaultValue={medication.dosageForm}
            placeholder="Enter dosage form" 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Current Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={medication.stock}
            placeholder="Enter current stock"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumStock">
            Minimum Stock Level
            <span className="text-sm text-muted-foreground ml-1">
              (Alert when stock is below this)
            </span>
          </Label>
          <Input
            id="minimumStock"
            name="minimumStock"
            type="number"
            min="0"
            defaultValue={medication.minimumStock}
            placeholder="Enter minimum stock level"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ($)</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={medication.unitPrice}
            placeholder="Enter unit price"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. tablet, capsule, ml"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            name="expiryDate"
            type="date"
            defaultValue={medication.expiryDate}
            required
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
