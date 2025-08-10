"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { AddMedicationForm } from "@/components/inventory/add-medication-form";
import { getMedications, createMedication, updateMedication, deleteMedication, type Medication } from "@/lib/inventory";
import ProceduresTable from "@/components/inventory/procedures-table";
import { getProcedures, createProcedure, updateProcedure, deleteProcedure, type ProcedureItem } from "@/lib/procedures";
import { toast } from "@/components/ui/use-toast";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [procedures, setProcedures] = React.useState<ProcedureItem[]>([]);
  const [procSearch, setProcSearch] = React.useState("");

  React.useEffect(() => {
    loadMedications();
    loadProcedures();
  }, []);

  async function loadMedications() {
    try {
      const data = await getMedications();
      setMedications(data);
      setError(null);
    } catch (err) {
      setError('Failed to load medications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProcedures() {
    try {
      const data = await getProcedures();
      setProcedures(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load procedures');
    }
  }

  const lowStockItems = medications.filter(
    (med) => med.stock <= med.minimumStock
  );

  const handleAddMedication = async (data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMedication(data);
      await loadMedications();
      setShowAddDialog(false);
    } catch (err) {
      console.error('Failed to add medication:', err);
      setError('Failed to add medication');
    }
  };

  const handleEditMedication = async (id: string, data: Partial<Medication>) => {
    try {
      await updateMedication(id, data);
      const updatedMedications = await getMedications();
      setMedications(updatedMedications);
      toast({
        title: "Medication updated",
        description: "The medication has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        title: "Error",
        description: "Failed to update medication. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedication = async (id: string) => {
    try {
      const success = await deleteMedication(id);
      if (success) {
        toast({
          title: "Success",
          description: "Medication deleted successfully",
        });
        await loadMedications();
      } else {
        throw new Error("Failed to delete medication");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete medication",
        variant: "destructive",
      });
      console.error(err);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory & Procedures</h1>
          <p className="text-muted-foreground">Manage medications and billable procedures</p>
        </div>
      </div>

      <Tabs defaultValue="meds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="meds">Medications</TabsTrigger>
          <TabsTrigger value="procedures">Procedures & Charges</TabsTrigger>
        </TabsList>

        <TabsContent value="meds" className="space-y-6">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Low Stock Alert</AlertTitle>
              <AlertDescription>
                The following items are below minimum stock level: {lowStockItems.map(item => item.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medications.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(medications.map(med => med.category))).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <div className="flex justify-end">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Medication</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new medication to add to inventory
                  </DialogDescription>
                </DialogHeader>
                <AddMedicationForm 
                  onSubmit={handleAddMedication}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Medication Inventory</CardTitle>
              <CardDescription>View and manage medication stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable 
                medications={medications}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onEdit={handleEditMedication}
                onDelete={handleDeleteMedication}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Procedures & Charges</CardTitle>
              <CardDescription>Manage billable procedures with FHIR coding</CardDescription>
            </CardHeader>
            <CardContent>
              <ProceduresTable
                procedures={procedures}
                searchTerm={procSearch}
                onSearchChange={setProcSearch}
                onCreate={async (data) => { await createProcedure(data); await loadProcedures(); }}
                onUpdate={async (id, data) => { await updateProcedure(id, data); await loadProcedures(); }}
                onDelete={async (id) => { await deleteProcedure(id); await loadProcedures(); }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}