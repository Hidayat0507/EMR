import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

// This would come from your database
const patients = [
  {
    id: "1",
    fullName: "John Doe",
    nric: "S1234567A",
    dateOfBirth: "1990-01-01",
    gender: "Male",
    phone: "+65 9123 4567",
    lastVisit: "2024-01-15",
    status: "Active",
  },
  {
    id: "2",
    fullName: "Jane Smith",
    nric: "S7654321B",
    dateOfBirth: "1985-05-15",
    gender: "Female",
    phone: "+65 8765 4321",
    lastVisit: "2024-01-10",
    status: "Active",
  },
  {
    id: "3",
    fullName: "David Wilson",
    nric: "S9876543C",
    dateOfBirth: "1978-12-20",
    gender: "Male",
    phone: "+65 9876 5432",
    lastVisit: "2024-01-05",
    status: "Follow-up",
  },
];

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Manage and view patient information
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            New Patient
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
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
              <CardTitle className="text-sm font-medium">New Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Pending this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        <Card>
          <CardHeader>
            <CardTitle>Patient List</CardTitle>
            <CardDescription>
              View and manage all patient records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search patients..."
                className="pl-9 pr-4 py-2 w-full rounded-md border border-input bg-transparent"
              />
            </div>
            <div className="mt-6 relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NRIC</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="hover:underline"
                        >
                          {patient.fullName}
                        </Link>
                      </TableCell>
                      <TableCell>{patient.nric}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          patient.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}>
                          {patient.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="ml-2"
                        >
                          <Link href={`/patients/${patient.id}/consultation`}>
                            New Consultation
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}