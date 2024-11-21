"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";

// Mock referral specialties
const specialties = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Orthopedics",
  "Psychiatry",
  "Ophthalmology",
];

// Mock hospitals/clinics
const facilities = [
  "General Hospital",
  "Medical Center",
  "Specialist Clinic",
  "Community Hospital",
];

interface ReferralMCSectionProps {
  patient: any; // Replace with proper type
}

export default function ReferralMCSection({ patient }: ReferralMCSectionProps) {
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showMCDialog, setShowMCDialog] = useState(false);

  return (
    <div className="grid gap-6">
      {/* Referral Letters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Referral Letters</CardTitle>
              <CardDescription>Manage patient referrals</CardDescription>
            </div>
            <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Referral
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate Referral Letter</DialogTitle>
                  <DialogDescription>
                    Create a new referral letter for the patient
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((specialty) => (
                            <SelectItem key={specialty} value={specialty.toLowerCase()}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Referred To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilities.map((facility) => (
                            <SelectItem key={facility} value={facility.toLowerCase()}>
                              {facility}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Doctor's Name</Label>
                      <Input placeholder="Enter doctor's name (if known)" />
                    </div>
                    <div className="space-y-2">
                      <Label>Urgency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for Referral</Label>
                    <Textarea
                      placeholder="Describe the reason for referral..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Clinical Information</Label>
                    <Textarea
                      placeholder="Relevant clinical information, investigations, and current treatment..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReferralDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Generate Referral</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample referral - replace with actual data */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Cardiology Referral</p>
                  <p className="text-sm text-muted-foreground">
                    General Hospital - {format(new Date(), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Certificates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Medical Certificates</CardTitle>
              <CardDescription>Issue and manage medical certificates</CardDescription>
            </div>
            <Dialog open={showMCDialog} onOpenChange={setShowMCDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New MC
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Medical Certificate</DialogTitle>
                  <DialogDescription>
                    Create a new medical certificate for the patient
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Days</Label>
                      <Input type="number" min="1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Medical reason for MC..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea
                        placeholder="Any additional notes or instructions..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowMCDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Issue MC</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample MC - replace with actual data */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Medical Leave Certificate</p>
                  <p className="text-sm text-muted-foreground">
                    2 Days - {format(new Date(), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}