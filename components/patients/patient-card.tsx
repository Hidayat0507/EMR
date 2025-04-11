"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/lib/models";
import { calculateAge } from "@/lib/utils";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Shield 
} from "lucide-react";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex flex-col items-start space-y-3">
          <div className="self-center bg-primary/10 p-3 rounded-full mb-2">
            <User className="h-6 w-6 text-primary" />
          </div>
          
          <div className="space-y-2 w-full">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {patient.fullName}
            </h1>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                <div className="flex">
                  <span className="mr-1">NRIC:</span>
                  <span className="font-medium text-foreground truncate">{patient.nric}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                <div className="flex">
                  <span className="mr-1">Age:</span>
                  <span className="font-medium text-foreground">
                    {`${calculateAge(patient.dateOfBirth)} years`}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3 text-primary flex-shrink-0" />
                <div className="flex">
                  <span className="mr-1">Contact:</span>
                  <span className="truncate">{patient.phone}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3 text-primary flex-shrink-0" />
                <div className="flex">
                  <span className="mr-1">Email:</span>
                  <span className="truncate">{patient.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
