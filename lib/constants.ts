export const MEDICATION_CATEGORIES = [
  "Analgesics",
  "Antibiotics",
  "Antidepressants",
  "Antidiabetics",
  "Antihistamines",
  "Antihypertensives",
  "Antivirals",
  "Cardiovascular",
  "Dermatological",
  "Gastrointestinal",
  "Hormones",
  "Respiratory",
  "Supplements",
  "Vaccines",
  "Other"
] as const;

export type MedicationCategory = typeof MEDICATION_CATEGORIES[number];
