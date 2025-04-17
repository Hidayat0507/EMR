"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getMedications, Medication } from "@/lib/inventory";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MedicationOption {
  value: string;
  label: string;
}

interface MedicationSearchProps {
  selectedMedication: MedicationOption | null;
  onSelectMedication: (medication: MedicationOption | null) => void;
}

export function MedicationSearch({ selectedMedication, onSelectMedication }: MedicationSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadMedications() {
      setLoading(true);
      setError(null);
      try {
        const meds = await getMedications();
        setMedications(meds);
      } catch (err) {
        console.error("Failed to load medications:", err);
        setError("Failed to load medications.");
      } finally {
        setLoading(false);
      }
    }
    loadMedications();
  }, []);

  const options: MedicationOption[] = medications.map(med => ({
    value: med.id,
    label: med.dosageForm ? `${med.name} (${med.dosageForm})` : med.name
  }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMedication
            ? options.find((option) => option.value === selectedMedication.value)?.label
            : "Select medication..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        <Command>
          <CommandInput placeholder="Search medication..." />
          <CommandList>
            {loading && <CommandItem disabled>Loading...</CommandItem>}
            {error && <CommandItem disabled className="text-destructive">{error}</CommandItem>}
            {!loading && !error && (
              <>
                <CommandEmpty>No medication found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onSelectMedication(option);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedMedication?.value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Debounce utility function
function debounce<F extends (...args: any[]) => any>(func: F, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<F>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}