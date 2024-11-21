"use client";

import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { inventory } from "@/lib/data";

interface MedicationOption {
  value: string;
  label: string;
  stock: number;
  unit: string;
}

interface MedicationSearchProps {
  onSelect: (medication: MedicationOption) => void;
}

export function MedicationSearch({ onSelect }: MedicationSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const medicationOptions: MedicationOption[] = inventory.medications.flatMap((med) =>
    med.strengths.map((strength) => ({
      value: `${med.id}-${strength}`,
      label: `${med.name} ${strength}`,
      stock: med.stock,
      unit: med.unit
    }))
  );

  const filteredMedications = searchTerm
    ? medicationOptions.filter((med) =>
        med.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <Command className="border rounded-md overflow-visible">
      <CommandInput 
        placeholder="Type medication name..." 
        value={searchTerm}
        onValueChange={(value) => {
          setSearchTerm(value);
          setOpen(value.length > 0);
        }}
        onFocus={() => setOpen(searchTerm.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="h-9 px-3 border-0"
      />
      {open && filteredMedications.length > 0 && (
        <CommandGroup className="absolute z-50 w-full bg-popover border rounded-md mt-1 shadow-md">
          {filteredMedications.map((option) => (
            <CommandItem
              key={option.value}
              value={option.label}
              onSelect={() => {
                onSelect(option);
                setSearchTerm(option.label);
                setOpen(false);
              }}
              className="px-3 py-2 cursor-pointer hover:bg-accent"
            >
              <span>{option.label}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                ({option.stock} {option.unit})
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </Command>
  );
}