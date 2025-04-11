"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Pencil } from "lucide-react";
import { Medication } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditMedicationForm } from "./edit-medication-form";

interface InventoryTableProps {
  medications: Medication[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEdit: (id: string, data: Partial<Medication>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function InventoryTable({ 
  medications, 
  searchTerm, 
  onSearchChange,
  onEdit,
  onDelete 
}: InventoryTableProps) {
  const [editingMedication, setEditingMedication] = React.useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = React.useState<Medication | null>(null);

  const filteredMedications = medications.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search medications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value.trim())}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Min. Stock</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedications.map((medication) => (
              <TableRow key={medication.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{medication.name}</p>
                  </div>
                </TableCell>
                <TableCell>{medication.category}</TableCell>
                <TableCell className={medication.stock <= medication.minimumStock ? "text-red-500 font-medium" : ""}>
                  {medication.stock} {medication.unit}
                </TableCell>
                <TableCell>{medication.minimumStock}</TableCell>
                <TableCell>${medication.unitPrice?.toFixed(2) || "N/A"}</TableCell>
                <TableCell>{medication.expiryDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMedication(medication)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingMedication(medication)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingMedication} onOpenChange={() => setEditingMedication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          {editingMedication && (
            <EditMedicationForm
              medication={editingMedication}
              onSubmit={async (data) => {
                await onEdit(editingMedication.id, data);
                setEditingMedication(null);
              }}
              onCancel={() => setEditingMedication(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingMedication} onOpenChange={() => setDeletingMedication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medication</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingMedication?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingMedication(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deletingMedication) {
                  await onDelete(deletingMedication.id);
                  setDeletingMedication(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
