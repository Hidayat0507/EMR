/**
 * Common Medications with RxNorm Codes
 * 
 * Use these for coding medications in FHIR MedicationRequest resources
 */

export interface MedicationCode {
  rxnorm?: {
    code: string;
    display: string;
  };
  text: string;
  strength?: string;
  form?: string;
}

/**
 * Common medications used in Malaysian primary care
 */
export const COMMON_MEDICATIONS: Record<string, MedicationCode> = {
  // Analgesics & Antipyretics
  'PARACETAMOL_500MG': {
    rxnorm: { code: '313782', display: 'Acetaminophen 500 MG Oral Tablet' },
    text: 'Paracetamol',
    strength: '500mg',
    form: 'Tablet'
  },
  'PARACETAMOL_1G': {
    rxnorm: { code: '313783', display: 'Acetaminophen 1000 MG Oral Tablet' },
    text: 'Paracetamol',
    strength: '1g',
    form: 'Tablet'
  },
  'IBUPROFEN_400MG': {
    rxnorm: { code: '310965', display: 'Ibuprofen 400 MG Oral Tablet' },
    text: 'Ibuprofen',
    strength: '400mg',
    form: 'Tablet'
  },
  'MEFENAMIC_ACID_500MG': {
    rxnorm: { code: '198013', display: 'Mefenamic Acid 500 MG Oral Capsule' },
    text: 'Mefenamic Acid (Ponstan)',
    strength: '500mg',
    form: 'Capsule'
  },
  
  // Antibiotics
  'AMOXICILLIN_500MG': {
    rxnorm: { code: '308182', display: 'Amoxicillin 500 MG Oral Capsule' },
    text: 'Amoxicillin',
    strength: '500mg',
    form: 'Capsule'
  },
  'AMOXICILLIN_CLAVULANATE_625MG': {
    rxnorm: { code: '617296', display: 'Amoxicillin 500 MG / Clavulanate 125 MG Oral Tablet' },
    text: 'Amoxicillin-Clavulanate (Augmentin)',
    strength: '625mg',
    form: 'Tablet'
  },
  'AZITHROMYCIN_500MG': {
    rxnorm: { code: '248656', display: 'Azithromycin 500 MG Oral Tablet' },
    text: 'Azithromycin (Zithromax)',
    strength: '500mg',
    form: 'Tablet'
  },
  'CEFUROXIME_250MG': {
    rxnorm: { code: '309045', display: 'Cefuroxime 250 MG Oral Tablet' },
    text: 'Cefuroxime (Zinnat)',
    strength: '250mg',
    form: 'Tablet'
  },
  'DOXYCYCLINE_100MG': {
    rxnorm: { code: '1652674', display: 'Doxycycline 100 MG Oral Capsule' },
    text: 'Doxycycline',
    strength: '100mg',
    form: 'Capsule'
  },
  
  // Gastrointestinal
  'OMEPRAZOLE_20MG': {
    rxnorm: { code: '312840', display: 'Omeprazole 20 MG Delayed Release Oral Capsule' },
    text: 'Omeprazole (Losec)',
    strength: '20mg',
    form: 'Capsule'
  },
  'RANITIDINE_150MG': {
    rxnorm: { code: '283742', display: 'Ranitidine 150 MG Oral Tablet' },
    text: 'Ranitidine',
    strength: '150mg',
    form: 'Tablet'
  },
  'DOMPERIDONE_10MG': {
    rxnorm: { code: '202975', display: 'Domperidone 10 MG Oral Tablet' },
    text: 'Domperidone (Motilium)',
    strength: '10mg',
    form: 'Tablet'
  },
  'METOCLOPRAMIDE_10MG': {
    rxnorm: { code: '205489', display: 'Metoclopramide 10 MG Oral Tablet' },
    text: 'Metoclopramide (Maxolon)',
    strength: '10mg',
    form: 'Tablet'
  },
  
  // Antihistamines
  'CETIRIZINE_10MG': {
    rxnorm: { code: '1014678', display: 'Cetirizine 10 MG Oral Tablet' },
    text: 'Cetirizine (Zyrtec)',
    strength: '10mg',
    form: 'Tablet'
  },
  'LORATADINE_10MG': {
    rxnorm: { code: '311372', display: 'Loratadine 10 MG Oral Tablet' },
    text: 'Loratadine (Clarityne)',
    strength: '10mg',
    form: 'Tablet'
  },
  'CHLORPHENIRAMINE_4MG': {
    rxnorm: { code: '1014676', display: 'Chlorpheniramine 4 MG Oral Tablet' },
    text: 'Chlorpheniramine (Piriton)',
    strength: '4mg',
    form: 'Tablet'
  },
  
  // Respiratory
  'SALBUTAMOL_100MCG': {
    rxnorm: { code: '745678', display: 'Salbutamol 0.1 MG/ACTUAT Metered Dose Inhaler' },
    text: 'Salbutamol (Ventolin) Inhaler',
    strength: '100mcg',
    form: 'Inhaler'
  },
  'PREDNISOLONE_5MG': {
    rxnorm: { code: '312617', display: 'Prednisolone 5 MG Oral Tablet' },
    text: 'Prednisolone',
    strength: '5mg',
    form: 'Tablet'
  },
  'DEXTROMETHORPHAN_15MG': {
    rxnorm: { code: '1014632', display: 'Dextromethorphan 15 MG Oral Tablet' },
    text: 'Dextromethorphan (Cough Suppressant)',
    strength: '15mg',
    form: 'Tablet'
  },
  
  // Cardiovascular
  'AMLODIPINE_5MG': {
    rxnorm: { code: '197361', display: 'Amlodipine 5 MG Oral Tablet' },
    text: 'Amlodipine (Norvasc)',
    strength: '5mg',
    form: 'Tablet'
  },
  'ATENOLOL_50MG': {
    rxnorm: { code: '866412', display: 'Atenolol 50 MG Oral Tablet' },
    text: 'Atenolol',
    strength: '50mg',
    form: 'Tablet'
  },
  'SIMVASTATIN_20MG': {
    rxnorm: { code: '312961', display: 'Simvastatin 20 MG Oral Tablet' },
    text: 'Simvastatin',
    strength: '20mg',
    form: 'Tablet'
  },
  'ATORVASTATIN_20MG': {
    rxnorm: { code: '617318', display: 'Atorvastatin 20 MG Oral Tablet' },
    text: 'Atorvastatin (Lipitor)',
    strength: '20mg',
    form: 'Tablet'
  },
  
  // Antidiabetic
  'METFORMIN_500MG': {
    rxnorm: { code: '860975', display: 'Metformin 500 MG Oral Tablet' },
    text: 'Metformin',
    strength: '500mg',
    form: 'Tablet'
  },
  'METFORMIN_850MG': {
    rxnorm: { code: '860993', display: 'Metformin 850 MG Oral Tablet' },
    text: 'Metformin',
    strength: '850mg',
    form: 'Tablet'
  },
  'GLIBENCLAMIDE_5MG': {
    rxnorm: { code: '310534', display: 'Glyburide 5 MG Oral Tablet' },
    text: 'Glibenclamide (Daonil)',
    strength: '5mg',
    form: 'Tablet'
  },
  
  // Vitamins & Supplements
  'VITAMIN_B_COMPLEX': {
    text: 'Vitamin B Complex',
    form: 'Tablet'
  },
  'VITAMIN_C_1000MG': {
    rxnorm: { code: '1158464', display: 'Ascorbic Acid 1000 MG Oral Tablet' },
    text: 'Vitamin C',
    strength: '1000mg',
    form: 'Tablet'
  },
  'CALCIUM_CARBONATE_600MG': {
    rxnorm: { code: '318076', display: 'Calcium Carbonate 600 MG Oral Tablet' },
    text: 'Calcium Carbonate',
    strength: '600mg',
    form: 'Tablet'
  },
};

/**
 * Search for a medication by name (fuzzy matching)
 */
export function findMedicationByName(name: string): MedicationCode | null {
  const searchName = name.toLowerCase().trim();
  
  // Exact match first
  for (const [key, medication] of Object.entries(COMMON_MEDICATIONS)) {
    if (medication.text.toLowerCase() === searchName) {
      return medication;
    }
  }
  
  // Partial match
  for (const [key, medication] of Object.entries(COMMON_MEDICATIONS)) {
    const medText = medication.text.toLowerCase();
    if (medText.includes(searchName) || searchName.includes(medText.split('(')[0].trim())) {
      return medication;
    }
  }
  
  // Match by key
  for (const [key, medication] of Object.entries(COMMON_MEDICATIONS)) {
    if (key.toLowerCase().includes(searchName.replace(/\s+/g, '_'))) {
      return medication;
    }
  }
  
  return null;
}

/**
 * Get all medications as an array
 */
export function getAllMedications(): MedicationCode[] {
  return Object.values(COMMON_MEDICATIONS);
}








