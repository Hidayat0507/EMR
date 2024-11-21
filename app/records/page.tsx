import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, FileUp, Download, Eye, Filter } from "lucide-react";

// Mock data for medical records
const records = [
  {
    id: "1",
    patientName: "John Doe",
    type: "Lab Result",
    category: "Blood Test",
    date: "2024-01-15",
    doctor: "Dr. Smith",
    status: "Complete",
  },
  {
    id: "2",
    patientName: "Jane Smith",
    type: "Imaging",
    category: "X-Ray",
    date: "2024-01-14",
    doctor: "Dr. Johnson",
    status: "Pending",
  },
  {
    id: "3",
    patientName: "David Wilson",
    type: "Prescription",
    category: "Medication",
    date: "2024-01-13",
    doctor: "Dr. Brown",
    status: "Complete",
  },
];

export default function RecordsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
          <p className="text-muted-foreground">
            View and manage patient medical records, lab results, and documents
          </p>
        </div>
        <Button>
          <FileUp className="mr-2 h-4 w-4" />
          Upload Record
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Records</TabsTrigger>
            <TabsTrigger value="lab">Lab Results</TabsTrigger>
            <TabsTrigger value="imaging">Imaging</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records by patient name, type, or date..."
                  className="pl-9 pr-4"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 text-sm font-medium">
                <div>Patient Name</div>
                <div>Type</div>
                <div>Category</div>
                <div>Date</div>
                <div>Doctor</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              {records.map((record) => (
                <div
                  key={record.id}
                  className="grid grid-cols-7 gap-4 p-4 border-t items-center text-sm"
                >
                  <div className="font-medium">{record.patientName}</div>
                  <div>{record.type}</div>
                  <div>{record.category}</div>
                  <div>{record.date}</div>
                  <div>{record.doctor}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        record.status === "Complete"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">
                In the last 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}