"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { batchCreateMedications, NewMedicationInput } from "@/lib/inventory";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const HEADER_MAP: Record<string, keyof NewMedicationInput> = {
  name: "name",
  category: "category",
  dosageform: "dosageForm",
  strengths: "strengths",
  stock: "stock",
  minimumstock: "minimumStock",
  unit: "unit",
  unitprice: "unitPrice",
  expirydate: "expiryDate",
  expirationdate: "expiryDate",
};

const REQUIRED_HEADERS: Array<keyof NewMedicationInput> = [
  "name",
  "category",
  "dosageForm",
  "strengths",
  "stock",
  "minimumStock",
  "unit",
  "unitPrice",
  "expiryDate",
];

const TEMPLATE_CSV = `name,category,dosageForm,strengths,stock,minimumStock,unit,unitPrice,expiryDate
Paracetamol,Analgesics,Tablet,"500mg|1g",200,30,tablet,0.5,2026-01-15
Amoxicillin,Antibiotics,Capsule,500mg,150,25,capsule,1.2,2025-11-30
`;

export interface BatchUploadMedicationsProps {
  onComplete: () => Promise<void> | void;
}

interface ParseResult {
  items: NewMedicationInput[];
  errors: string[];
}

export function BatchUploadMedications({ onComplete }: BatchUploadMedicationsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [stagedItems, setStagedItems] = useState<NewMedicationInput[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrors([]);

    try {
      const text = await file.text();
      const { items, errors: parseErrors } = parseMedicationCsv(text);

      if (parseErrors.length > 0) {
        setStagedItems([]);
        setErrors(parseErrors);
        return;
      }

      if (items.length === 0) {
        setStagedItems([]);
        setErrors(["CSV parsed successfully but no valid rows were found."]);
        return;
      }

      setStagedItems(items);
      setErrors([]);
      toast({
        title: "Preview ready",
        description: `${items.length} medication${items.length === 1 ? "" : "s"} parsed. Review and click Upload to system.`,
      });
    } catch (error: any) {
      setStagedItems([]);
      setErrors([error?.message || "Failed to process file."]);
    }
  };

  const handleConfirmUpload = async () => {
    if (stagedItems.length === 0) {
      return;
    }

    setIsUploading(true);
    setErrors([]);

    try {
      const result = await batchCreateMedications(stagedItems);

      if (result.created > 0) {
        toast({
          title: "Batch upload complete",
          description: `${result.created} medication${result.created === 1 ? "" : "s"} added${result.failed ? `, ${result.failed} failed` : ""}.`,
        });
      }

      if (result.failed > 0) {
        setErrors([`Failed to import ${result.failed} row${result.failed === 1 ? "" : "s"}. Check the console for details.`]);
      } else {
        setStagedItems([]);
        resetInput();
      }

      await onComplete();
    } catch (error: any) {
      setErrors([error?.message || "Failed to upload medications."]);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setStagedItems([]);
    setErrors([]);
    resetInput();
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "medications-template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Required columns:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>name</strong>, <strong>category</strong>, <strong>dosageForm</strong>, <strong>strengths</strong></li>
          <li><strong>stock</strong>, <strong>minimumStock</strong>, <strong>unit</strong>, <strong>unitPrice</strong>, <strong>expiryDate</strong></li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          Download CSV template
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        CSV only. Pick file, preview, then upload.
      </p>

      {stagedItems.length > 0 && (
        <div className="space-y-3 rounded-md border border-border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Preview ({stagedItems.length} medication{stagedItems.length === 1 ? "" : "s"})
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={clearPreview} disabled={isUploading}>
                Clear
              </Button>
              <Button type="button" onClick={handleConfirmUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Strengths</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagedItems.map((item, idx) => (
                  <TableRow key={`${item.name}-${idx}`}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.dosageForm}</TableCell>
                    <TableCell>{item.strengths.join(", ") || "-"}</TableCell>
                    <TableCell className="text-right">{item.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Upload issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function parseMedicationCsv(text: string): ParseResult {
  const cleanText = text.replace(/^\uFEFF/, "");
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { items: [], errors: ["File is empty."] };
  }

  const headerLine = lines[0];
  const headers = splitCsvLine(headerLine);
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));

  const missingHeaders = REQUIRED_HEADERS.filter((required) => {
    const normalizedRequired = normalizeHeader(required);
    return !normalizedHeaders.some((header) => HEADER_MAP[header] === required || header === normalizedRequired);
  });

  if (missingHeaders.length > 0) {
    return {
      items: [],
      errors: [
        `Missing required header${missingHeaders.length === 1 ? "" : "s"}: ${missingHeaders.join(", ")}`,
      ],
    };
  }

  const errors: string[] = [];
  const items: NewMedicationInput[] = [];

  lines.slice(1).forEach((line, index) => {
    if (!line.trim()) {
      return;
    }

    const values = splitCsvLine(line);
    const rowNumber = index + 2; // account for header line

    const row: Partial<Record<keyof NewMedicationInput, string>> = {};

    values.forEach((value, valueIndex) => {
      const normalizedHeader = normalizedHeaders[valueIndex];
      const key = normalizedHeader ? HEADER_MAP[normalizedHeader] : undefined;
      if (key) {
        row[key] = value.trim();
      }
    });

    try {
      const parsed = buildMedicationInput(row, rowNumber);
      if (parsed) {
        items.push(parsed);
      }
    } catch (error: any) {
      errors.push(error?.message || `Row ${rowNumber}: Invalid data`);
    }
  });

  return { items, errors };
}

function buildMedicationInput(row: Partial<Record<keyof NewMedicationInput, string>>, rowNumber: number): NewMedicationInput | null {
  const requiredFields: Array<keyof NewMedicationInput> = ["name", "category", "dosageForm", "unit"];

  for (const field of requiredFields) {
    if (!row[field] || row[field]?.trim() === "") {
      throw new Error(`Row ${rowNumber}: "${field}" is required.`);
    }
  }

  const strengths = (row.strengths || "")
    .split(/[,;|]/)
    .map((strength) => strength.trim())
    .filter(Boolean);

  const stock = parseNumber(row.stock, rowNumber, "stock");
  const minimumStock = parseNumber(row.minimumStock, rowNumber, "minimumStock");
  const unitPrice = parseFloat(row.unitPrice || "0");

  if (Number.isNaN(unitPrice) || unitPrice < 0) {
    throw new Error(`Row ${rowNumber}: "unitPrice" must be a positive number.`);
  }

  return {
    name: row.name!.trim(),
    category: row.category!.trim(),
    dosageForm: row.dosageForm!.trim(),
    strengths,
    stock,
    minimumStock,
    unit: row.unit!.trim(),
    unitPrice,
    expiryDate: (row.expiryDate || "").trim(),
  };
}

function parseNumber(value: string | undefined, rowNumber: number, field: string): number {
  if (!value || value.trim() === "") {
    return 0;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Row ${rowNumber}: "${field}" must be a positive number.`);
  }
  return parsed;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizeHeader(header: string | keyof NewMedicationInput): string {
  return header.toString().trim().toLowerCase().replace(/[\s_]/g, "");
}
