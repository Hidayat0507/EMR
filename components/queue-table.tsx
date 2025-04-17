"use client";

import { Patient } from "@/lib/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MoreHorizontal, UserPlus, X, Receipt } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { addPatientToQueue, removePatientFromQueue, updateQueueStatus } from "@/lib/actions";
import { QueueStatus } from "@/lib/types";
import { useRouter } from 'next/navigation';

interface QueueTableProps {
  patients: Patient[];
  onQueueUpdate?: () => Promise<void>;
}

export default function QueueTable({ patients, onQueueUpdate }: QueueTableProps) {
  const router = useRouter();

  const handleAddToQueue = async (patient: Patient) => {
    try {
      await addPatientToQueue(patient.id);
      toast({
        title: "Added to Queue",
        description: `${patient.fullName} has been added to the queue.`,
      });
      if (onQueueUpdate) {
        await onQueueUpdate();
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to queue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartConsultation = async (patient: Patient) => {
    try {
      await updateQueueStatus(patient.id, 'in_consultation');
      router.push(`/patients/${patient.id}/consultation`);
      
      toast({
        title: "Starting Consultation",
        description: `Redirecting to ${patient.fullName}'s consultation page...`,
      });
      
      if (onQueueUpdate) {
        await onQueueUpdate();
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCompleteConsultation = async (patient: Patient) => {
    try {
      await updateQueueStatus(patient.id, 'completed');
      toast({
        title: "Consultation Completed",
        description: `${patient.fullName}'s consultation has been marked as completed.`,
      });
      if (onQueueUpdate) {
        await onQueueUpdate();
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromQueue = async (patient: Patient) => {
    try {
      await removePatientFromQueue(patient.id);
      toast({
        title: "Removed from Queue",
        description: `${patient.fullName} has been removed from the queue.`,
      });
      if (onQueueUpdate) {
        await onQueueUpdate();
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove from queue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: QueueStatus | undefined) => {
    switch (status) {
      case 'waiting':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Waiting
          </Badge>
        );
      case 'in_consultation':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <UserPlus className="h-3 w-3" />
            In Consultation
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'meds_and_bills':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-400 text-zinc-900 hover:bg-yellow-500">
            <Receipt className="h-3 w-3" />
            Meds & Bills
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Queue No.</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>NRIC</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Added At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient, index) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium text-center">{(index + 1).toString().padStart(3, '0')}</TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/patients/${patient.id}`}
                  className="hover:underline"
                >
                  {patient.fullName}
                </Link>
              </TableCell>
              <TableCell>{patient.nric}</TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell>
                {patient.queueAddedAt 
                  ? new Date(patient.queueAddedAt).toLocaleTimeString()
                  : 'N/A'}
              </TableCell>
              <TableCell>
                {getStatusBadge(patient.queueStatus)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/patients/${patient.id}`}>
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {patient.queueStatus === 'waiting' && (
                      <DropdownMenuItem onClick={() => handleStartConsultation(patient)}>
                        Start Consultation
                      </DropdownMenuItem>
                    )}
                    {(patient.queueStatus === 'waiting' || patient.queueStatus === 'in_consultation' || patient.queueStatus === 'meds_and_bills') && (
                      <DropdownMenuItem onClick={() => handleCompleteConsultation(patient)}>
                        Mark as Complete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No patients in queue
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 