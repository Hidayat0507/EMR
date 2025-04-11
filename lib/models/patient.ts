export interface Patient {
  id: string;
  name: string;
  fullName: string;
  nric: string;
  gender: 'male' | 'female' | 'other';
  contact: string;
  phone?: string;
  dateOfBirth?: Date;
  createdAt: Date;
  lastVisit?: Date;
  medicalHistory?: {
    conditions: string[];
    allergies: string[];
    medications: string[];
  };
  conditions: string[];
  allergies: string[];
  medications: string[];
}
