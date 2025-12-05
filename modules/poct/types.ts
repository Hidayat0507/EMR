/**
 * POCT (Point of Care Testing) Module Types
 */

export type POCTTestType =
  | 'blood_glucose'
  | 'urinalysis'
  | 'pregnancy'
  | 'strep_throat'
  | 'influenza'
  | 'covid19'
  | 'hemoglobin'
  | 'cholesterol'
  | 'inr'
  | 'troponin'
  | 'bnp'
  | 'other';

export type POCTTestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type POCTResultType = 'positive' | 'negative' | 'normal' | 'abnormal' | 'inconclusive';

export interface POCTTest {
  id: string;
  patientId: string;
  patientName?: string;
  consultationId?: string;
  testType: POCTTestType;
  testName: string;
  status: POCTTestStatus;
  orderedBy: string;
  orderedAt: Date | string;
  performedBy?: string;
  performedAt?: Date | string;
  completedAt?: Date | string;
  result?: POCTTestResult;
  notes?: string;
  urgency?: 'routine' | 'urgent' | 'stat';
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface POCTTestResult {
  resultType: POCTResultType;
  numericValue?: number;
  unit?: string;
  referenceRange?: string;
  findings?: string;
  interpretation?: string;
  attachments?: string[];
}

export interface POCTTestDefinition {
  type: POCTTestType;
  name: string;
  description: string;
  category: 'hematology' | 'chemistry' | 'microbiology' | 'immunology' | 'other';
  expectedDuration: number; // in minutes
  requiresSpecimen?: string;
  normalRange?: string;
}

export const POCT_TEST_DEFINITIONS: Record<POCTTestType, POCTTestDefinition> = {
  blood_glucose: {
    type: 'blood_glucose',
    name: 'Blood Glucose',
    description: 'Random blood glucose measurement',
    category: 'chemistry',
    expectedDuration: 5,
    requiresSpecimen: 'Capillary blood',
    normalRange: '70-140 mg/dL',
  },
  urinalysis: {
    type: 'urinalysis',
    name: 'Urinalysis',
    description: 'Complete urine analysis',
    category: 'chemistry',
    expectedDuration: 10,
    requiresSpecimen: 'Urine sample',
    normalRange: 'See reference chart',
  },
  pregnancy: {
    type: 'pregnancy',
    name: 'Pregnancy Test',
    description: 'Urine pregnancy test (hCG)',
    category: 'immunology',
    expectedDuration: 5,
    requiresSpecimen: 'Urine sample',
    normalRange: 'Negative',
  },
  strep_throat: {
    type: 'strep_throat',
    name: 'Strep Throat Test',
    description: 'Rapid strep A antigen detection',
    category: 'microbiology',
    expectedDuration: 10,
    requiresSpecimen: 'Throat swab',
    normalRange: 'Negative',
  },
  influenza: {
    type: 'influenza',
    name: 'Influenza Test',
    description: 'Rapid influenza A/B antigen detection',
    category: 'microbiology',
    expectedDuration: 15,
    requiresSpecimen: 'Nasopharyngeal swab',
    normalRange: 'Negative',
  },
  covid19: {
    type: 'covid19',
    name: 'COVID-19 Rapid Test',
    description: 'SARS-CoV-2 antigen rapid test',
    category: 'microbiology',
    expectedDuration: 15,
    requiresSpecimen: 'Nasopharyngeal swab',
    normalRange: 'Negative',
  },
  hemoglobin: {
    type: 'hemoglobin',
    name: 'Hemoglobin',
    description: 'Hemoglobin concentration measurement',
    category: 'hematology',
    expectedDuration: 5,
    requiresSpecimen: 'Capillary blood',
    normalRange: 'M: 13.5-17.5, F: 12.0-15.5 g/dL',
  },
  cholesterol: {
    type: 'cholesterol',
    name: 'Cholesterol Panel',
    description: 'Total cholesterol, HDL, LDL measurement',
    category: 'chemistry',
    expectedDuration: 10,
    requiresSpecimen: 'Capillary blood',
    normalRange: 'Total: <200 mg/dL',
  },
  inr: {
    type: 'inr',
    name: 'INR (Coagulation)',
    description: 'International Normalized Ratio',
    category: 'hematology',
    expectedDuration: 5,
    requiresSpecimen: 'Capillary blood',
    normalRange: '0.8-1.2 (no anticoagulation)',
  },
  troponin: {
    type: 'troponin',
    name: 'Cardiac Troponin',
    description: 'Troponin I rapid test for cardiac injury',
    category: 'chemistry',
    expectedDuration: 15,
    requiresSpecimen: 'Capillary blood',
    normalRange: '<0.04 ng/mL',
  },
  bnp: {
    type: 'bnp',
    name: 'BNP (Brain Natriuretic Peptide)',
    description: 'Heart failure marker',
    category: 'chemistry',
    expectedDuration: 15,
    requiresSpecimen: 'Venous blood',
    normalRange: '<100 pg/mL',
  },
  other: {
    type: 'other',
    name: 'Other Test',
    description: 'Custom or other point-of-care test',
    category: 'other',
    expectedDuration: 15,
    requiresSpecimen: 'As required',
  },
};








