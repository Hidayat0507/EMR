import { getConsultationsWithDetails } from "@/lib/models";
import { BillableConsultation, QueueStatus } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/utils";

export default async function OrdersPage() {
  const statuses: QueueStatus[] = ['meds_and_bills', 'completed'];
  const consultations = await getConsultationsWithDetails(statuses);

  const getStatusBadge = (status: QueueStatus | undefined | string) => {
    switch (status) {
      case 'meds_and_bills':
        return <Badge variant="secondary" className="bg-yellow-400 text-zinc-900 hover:bg-yellow-500">Meds & Bills</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 container mx-auto py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Documents</h1>
          <p className="text-muted-foreground">
            Generate bills, MCs, and referral letters for completed consultations.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Consultations</CardTitle>
          <CardDescription>Select a consultation to generate documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-6 relative border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Consultation Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.length > 0 ? (
                  consultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">
                        <Link href={`/patients/${consultation.patientId}`} className="hover:underline">
                          {consultation.patientFullName || 'N/A'}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDisplayDate(consultation.date)}</TableCell>
                      <TableCell>{getStatusBadge(consultation.queueStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/orders/${consultation.id}/bill`}>
                            <Button variant="outline" size="sm">Bill</Button>
                          </Link>
                          <Link href={`/orders/${consultation.id}/mc`}>
                            <Button variant="outline" size="sm">MC</Button>
                          </Link>
                          <Link href={`/orders/${consultation.id}/referral`}>
                            <Button variant="outline" size="sm">Referral</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No billable consultations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
