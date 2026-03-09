"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMedications, Medication } from "@/lib/inventory";
import { Prescription, ProcedureRecord } from "@/lib/models";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OrderOption = {
  id: string;
  label: string;
  type: "medication" | "procedure" | "lab" | "imaging";
  price?: number;
  payload?: any;
};

const frequencies = [
  { value: "od", label: "OD" },
  { value: "bd", label: "BD" },
  { value: "tds", label: "TDS" },
  { value: "qid", label: "QID" },
  { value: "prn", label: "PRN" },
];

const durations = [
  { value: "3d", label: "3 days" },
  { value: "5d", label: "5 days" },
  { value: "1w", label: "1 week" },
  { value: "2w", label: "2 weeks" },
  { value: "1m", label: "1 month" },
];

export type ProcedureOption = { id: string; label: string; price?: number; codingSystem?: string; codingCode?: string; codingDisplay?: string };
export type LabOption = { code: string; label: string };
export type ImagingOption = { code: string; label: string };

interface OrderComposerProps {
  procedureOptions: ProcedureOption[];
  labOptions?: LabOption[];
  imagingOptions?: ImagingOption[];
  initialPrescriptions?: Prescription[];
  initialProcedures?: ProcedureRecord[];
  initialLabSelections?: string[];
  initialImagingSelections?: string[];
  onPrescriptionsChange: (prescriptions: Prescription[]) => void;
  onProceduresChange: (procedures: ProcedureRecord[]) => void;
  onLabsChange?: (labs: string[]) => void;
  onImagingChange?: (imaging: string[]) => void;
}

export function OrderComposer({
  procedureOptions,
  labOptions = [],
  imagingOptions = [],
  initialPrescriptions = [],
  initialProcedures = [],
  initialLabSelections = [],
  initialImagingSelections = [],
  onPrescriptionsChange,
  onProceduresChange,
  onLabsChange,
  onImagingChange,
}: OrderComposerProps) {
  const [open, setOpen] = React.useState(false);
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [loadingMeds, setLoadingMeds] = React.useState(true);
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>(initialPrescriptions);
  const [procedures, setProcedures] = React.useState<ProcedureRecord[]>(initialProcedures);
  const [labs, setLabs] = React.useState<string[]>(initialLabSelections);
  const [imaging, setImaging] = React.useState<string[]>(initialImagingSelections);

  React.useEffect(() => {
    let active = true;
    getMedications().then(meds => {
      if (active) setMedications(meds);
    }).catch(() => {
      if (active) setMedications([]);
    }).finally(() => {
      if (active) setLoadingMeds(false);
    });
    return () => { active = false; };
  }, []);

  React.useEffect(() => onPrescriptionsChange(prescriptions), [prescriptions, onPrescriptionsChange]);
  React.useEffect(() => onProceduresChange(procedures), [procedures, onProceduresChange]);
  React.useEffect(() => onLabsChange?.(labs), [labs, onLabsChange]);
  React.useEffect(() => onImagingChange?.(imaging), [imaging, onImagingChange]);

  const [query, setQuery] = React.useState("");
  const hasQuery = query.trim().length > 0;

  const [isMedDialogOpen, setIsMedDialogOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [draftPrescription, setDraftPrescription] = React.useState<Prescription | null>(null);
  const [isProcDialogOpen, setIsProcDialogOpen] = React.useState(false);
  const [editingProcIndex, setEditingProcIndex] = React.useState<number | null>(null);
  const [draftProcedure, setDraftProcedure] = React.useState<ProcedureRecord | null>(null);

  const options: OrderOption[] = React.useMemo(() => {
    const medOptions: OrderOption[] = medications.map((m) => ({
      id: m.id,
      label: m.dosageForm ? `${m.name} (${m.dosageForm})` : m.name,
      type: "medication",
      payload: m,
    }));
    const procOptions: OrderOption[] = procedureOptions.map((p) => ({
      id: p.id,
      label: p.label,
      type: "procedure",
      price: p.price,
      payload: { codingSystem: p.codingSystem, codingCode: p.codingCode, codingDisplay: p.codingDisplay },
    }));
    const labOrderOptions: OrderOption[] = labOptions.map((l) => ({
      id: l.code,
      label: l.label,
      type: "lab",
    }));
    const imagingOrderOptions: OrderOption[] = imagingOptions.map((i) => ({
      id: i.code,
      label: i.label,
      type: "imaging",
    }));
    return [...medOptions, ...procOptions, ...labOrderOptions, ...imagingOrderOptions];
  }, [medications, procedureOptions, labOptions, imagingOptions]);

  const filteredMedOptions = React.useMemo(() => {
    if (!hasQuery) return [] as OrderOption[];
    const q = query.toLowerCase();
    return options
      .filter(o => o.type === "medication" && o.label.toLowerCase().includes(q));
  }, [options, query, hasQuery]);

  const filteredProcOptions = React.useMemo(() => {
    if (!hasQuery) return [] as OrderOption[];
    const q = query.toLowerCase();
    return options
      .filter(o => o.type === "procedure" && o.label.toLowerCase().includes(q));
  }, [options, query, hasQuery]);

  const filteredLabOptions = React.useMemo(() => {
    if (!hasQuery) return [] as OrderOption[];
    const q = query.toLowerCase();
    return options
      .filter(o => o.type === "lab" && o.label.toLowerCase().includes(q));
  }, [options, query, hasQuery]);

  const filteredImagingOptions = React.useMemo(() => {
    if (!hasQuery) return [] as OrderOption[];
    const q = query.toLowerCase();
    return options
      .filter(o => o.type === "imaging" && o.label.toLowerCase().includes(q));
  }, [options, query, hasQuery]);

  const handleSelect = (opt: OrderOption) => {
    if (opt.type === "medication") {
      // Add to list first; details will be edited when clicking the list item
      const newItem: Prescription = {
        medication: { id: opt.id, name: (opt.payload?.name as string) ?? opt.label.split(" (")[0] },
        frequency: "",
        duration: "",
      };
      setPrescriptions((prev) => [...prev, newItem]);
      setQuery("");
    } else if (opt.type === "procedure") {
      // Add to list first; details will be edited when clicking the list item
      const proc: ProcedureRecord = {
        name: opt.label,
        price: opt.price,
        procedureId: opt.id,
        codingSystem: opt.payload?.codingSystem,
        codingCode: opt.payload?.codingCode,
        codingDisplay: opt.payload?.codingDisplay,
      };
      setProcedures((prev) => [...prev, proc]);
      setQuery("");
    } else if (opt.type === "lab") {
      setLabs((prev) => (prev.includes(opt.id) ? prev : [...prev, opt.id]));
      setQuery("");
    } else if (opt.type === "imaging") {
      setImaging((prev) => (prev.includes(opt.id) ? prev : [...prev, opt.id]));
      setQuery("");
    }
    setOpen(false);
  };

  const removePrescription = (index: number) => setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  const removeProcedure = (index: number) => setProcedures((prev) => prev.filter((_, i) => i !== index));
  const removeLab = (code: string) => setLabs((prev) => prev.filter((c) => c !== code));
  const removeImaging = (code: string) => setImaging((prev) => prev.filter((c) => c !== code));

  const findLabLabel = (code: string) => labOptions.find((l) => l.code === code)?.label ?? code;
  const findImagingLabel = (code: string) => imagingOptions.find((i) => i.code === code)?.label ?? code;

  return (
    <div className="space-y-3">
      {/* Unified type-to-add field */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9"
          >
            Type to order
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search to order (MedicationRequest/ServiceRequest)..." onValueChange={setQuery} />
            <CommandList>
              {!hasQuery ? (
                <CommandEmpty>Start typing to search…</CommandEmpty>
              ) : (
                <>
                  <CommandGroup heading="Medications">
                    {loadingMeds && <CommandItem disabled>Loading...</CommandItem>}
                    {!loadingMeds && filteredMedOptions.map((opt) => (
                      <CommandItem key={`med-${opt.id}`} value={opt.label} onSelect={() => handleSelect(opt)}>
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Procedures">
                    {procedureOptions.length === 0 && <CommandItem disabled>No procedures configured</CommandItem>}
                    {filteredProcOptions.map((opt) => (
                      <CommandItem key={`proc-${opt.id}`} value={opt.label} onSelect={() => handleSelect(opt)}>
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Labs">
                    {labOptions.length === 0 && <CommandItem disabled>No labs configured</CommandItem>}
                    {filteredLabOptions.map((opt) => (
                      <CommandItem key={`lab-${opt.id}`} value={opt.label} onSelect={() => handleSelect(opt)}>
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="X-Ray">
                    {imagingOptions.length === 0 && <CommandItem disabled>No imaging configured</CommandItem>}
                    {filteredImagingOptions.map((opt) => (
                      <CommandItem key={`img-${opt.id}`} value={opt.label} onSelect={() => handleSelect(opt)}>
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Added items list */}
      <div className="space-y-2">
        {prescriptions.map((p, index) => (
          <div
            key={`p-${index}`}
            className="border rounded-md p-2 hover:bg-accent/30 cursor-pointer"
            role="button"
            onClick={() => {
              setEditingIndex(index);
              setDraftPrescription(p);
              setIsMedDialogOpen(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{p.medication.name}</div>
                {(p.frequency || p.duration) && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[
                      ((): string => {
                        const map: Record<string, string> = { od: "OD", bd: "BD", tds: "TDS", qid: "QID", qds: "QID", prn: "PRN" };
                        return map[p.frequency] ?? (p.frequency ? p.frequency.toUpperCase() : "");
                      })(),
                      p.duration,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  removePrescription(index);
                }}
                aria-label="Remove medication"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {procedures.map((proc, index) => (
          <div
            key={`r-${index}`}
            className="border rounded-md p-2 hover:bg-accent/30 cursor-pointer"
            role="button"
            onClick={() => {
              setEditingProcIndex(index);
              setDraftProcedure(proc);
              setIsProcDialogOpen(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{proc.name}</div>
                {typeof proc.price !== 'undefined' && (
                  <div className="text-xs text-muted-foreground mt-0.5">${proc.price.toFixed(2)}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  removeProcedure(index);
                }}
                aria-label="Remove procedure"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {labs.map((code) => (
          <div
            key={`lab-${code}`}
            className="border rounded-md p-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{findLabLabel(code)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Lab</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeLab(code)}
                aria-label="Remove lab"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {imaging.map((code) => (
          <div
            key={`img-${code}`}
            className="border rounded-md p-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{findImagingLabel(code)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">X-Ray</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeImaging(code)}
                aria-label="Remove imaging"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Medication details dialog */}
      <Dialog open={isMedDialogOpen} onOpenChange={setIsMedDialogOpen}>
        <DialogContent className="sm:max-w-md p-4" aria-describedby={undefined}>
          {draftPrescription && (
            <>
              <DialogHeader className="pb-0">
                <DialogTitle className="text-base leading-tight">{draftPrescription.medication.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  Update medication frequency and duration before signing this order.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Frequency</Label>
                  <Select value={draftPrescription.frequency} onValueChange={(val) => setDraftPrescription({ ...draftPrescription, frequency: val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {frequencies.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Select value={draftPrescription.duration} onValueChange={(val) => setDraftPrescription({ ...draftPrescription, duration: val })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {durations.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-1">
                <Button variant="outline" onClick={() => setIsMedDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (!draftPrescription) return;
                    if (editingIndex === null) {
                      setPrescriptions(prev => [...prev, draftPrescription]);
                    } else {
                      setPrescriptions(prev => prev.map((p, i) => (i === editingIndex ? draftPrescription : p)));
                    }
                    setIsMedDialogOpen(false);
                    setDraftPrescription(null);
                    setEditingIndex(null);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Procedure details dialog */}
      <Dialog open={isProcDialogOpen} onOpenChange={setIsProcDialogOpen}>
        <DialogContent className="sm:max-w-md p-4" aria-describedby={undefined}>
          {draftProcedure && (
            <>
              <DialogHeader className="pb-0">
                <DialogTitle className="text-base leading-tight">{draftProcedure.name}</DialogTitle>
                <DialogDescription className="text-xs">
                  Add or revise notes for this procedure order.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs">Notes</Label>
                  <textarea
                    className="mt-1 w-full h-24 rounded-md border px-2 py-1 text-sm"
                    placeholder="Add procedure notes..."
                    value={draftProcedure.notes ?? ""}
                    onChange={(e) => setDraftProcedure({ ...draftProcedure, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="pt-1">
                <Button variant="outline" onClick={() => setIsProcDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    if (!draftProcedure) return;
                    if (editingProcIndex === null) {
                      setProcedures(prev => [...prev, draftProcedure]);
                    } else {
                      setProcedures(prev => prev.map((p, i) => (i === editingProcIndex ? draftProcedure : p)));
                    }
                    setIsProcDialogOpen(false);
                    setDraftProcedure(null);
                    setEditingProcIndex(null);
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
