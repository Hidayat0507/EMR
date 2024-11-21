import { format, subDays, subMonths } from 'date-fns';

export const patients = [
  {
    id: "1",
    fullName: "John Doe",
    nric: "S1234567A",
    dateOfBirth: "1990-01-01",
    gender: "Male",
    email: "john.doe@example.com",
    phone: "+65 9123 4567",
    address: "123 Main Street",
    postalCode: "123456",
    lastVisit: "2024-01-15",
    upcomingAppointment: "2024-02-01",
    medicalHistory: {
      allergies: "Penicillin",
      chronicConditions: "Hypertension",
      currentMedications: "Lisinopril 10mg daily"
    },
    emergencyContact: {
      name: "Jane Doe",
      relationship: "Spouse",
      phone: "+65 9876 5432"
    }
  },
  {
    id: "2",
    fullName: "Sarah Smith",
    nric: "S7654321B",
    dateOfBirth: "1985-05-15",
    gender: "Female",
    email: "sarah.smith@example.com",
    phone: "+65 9234 5678",
    address: "456 Oak Road",
    postalCode: "654321",
    lastVisit: "2024-01-20",
    upcomingAppointment: "2024-02-05",
    medicalHistory: {
      allergies: "Sulfa drugs",
      chronicConditions: "Diabetes Type 2",
      currentMedications: "Metformin 500mg twice daily"
    },
    emergencyContact: {
      name: "John Smith",
      relationship: "Husband",
      phone: "+65 9765 4321"
    }
  }
];

export const consultations = {
  "1": [
    {
      id: "c1",
      date: format(subDays(new Date(), 5), "yyyy-MM-dd"),
      doctor: "Dr. Smith",
      type: "Follow-up",
      notes: "Patient reports improved blood pressure control. BP reading: 128/82. Continuing current medication regimen.",
      diagnosis: "Controlled hypertension",
      procedures: ["Blood pressure measurement"],
      prescriptions: [
        {
          medication: "Lisinopril",
          dosage: "10mg",
          frequency: "Once daily",
          duration: "1 month"
        }
      ]
    }
  ],
  "2": [
    {
      id: "c2",
      date: format(subDays(new Date(), 2), "yyyy-MM-dd"),
      doctor: "Dr. Johnson",
      type: "Regular Check-up",
      notes: "Blood sugar levels stable. HbA1c: 6.8%. Patient following diet and exercise recommendations.",
      diagnosis: "Well-controlled diabetes",
      procedures: ["Blood glucose measurement", "HbA1c test"],
      prescriptions: [
        {
          medication: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily",
          duration: "3 months"
        }
      ]
    }
  ]
};

export const inventory = {
  medications: [
    {
      id: "med1",
      name: "Lisinopril",
      genericName: "Lisinopril",
      category: "ACE Inhibitor",
      dosageForm: "Tablet",
      strengths: ["5mg", "10mg", "20mg"],
      stock: 150,
      unit: "tablets",
      reorderLevel: 30,
      manufacturer: "Generic Co",
      expiryDate: "2025-12-31"
    },
    {
      id: "med2",
      name: "Amoxicillin",
      genericName: "Amoxicillin",
      category: "Antibiotic",
      dosageForm: "Capsule",
      strengths: ["250mg", "500mg"],
      stock: 200,
      unit: "capsules",
      reorderLevel: 50,
      manufacturer: "Pharma Inc",
      expiryDate: "2025-06-30"
    },
    {
      id: "med3",
      name: "Paracetamol",
      genericName: "Acetaminophen",
      category: "Analgesic",
      dosageForm: "Tablet",
      strengths: ["500mg", "650mg"],
      stock: 300,
      unit: "tablets",
      reorderLevel: 100,
      manufacturer: "Health Labs",
      expiryDate: "2025-09-30"
    },
    {
      id: "med4",
      name: "Metformin",
      genericName: "Metformin HCl",
      category: "Antidiabetic",
      dosageForm: "Tablet",
      strengths: ["500mg", "850mg", "1000mg"],
      stock: 180,
      unit: "tablets",
      reorderLevel: 40,
      manufacturer: "Diabetes Care",
      expiryDate: "2025-08-31"
    }
  ]
};