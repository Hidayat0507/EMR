/**
 * PACS (Picture Archiving and Communication System) Module Types
 */

export type ImagingModality =
  | 'xray'
  | 'ct'
  | 'mri'
  | 'ultrasound'
  | 'ecg'
  | 'echo'
  | 'other';

export type ImagingStatus = 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'reported' | 'cancelled';

export type ImagingPriority = 'routine' | 'urgent' | 'stat';

export interface ImagingStudy {
  id: string;
  patientId: string;
  patientName?: string;
  consultationId?: string;
  modality: ImagingModality;
  studyType: string;
  bodyPart: string;
  status: ImagingStatus;
  priority: ImagingPriority;
  orderedBy: string;
  orderedAt: Date | string;
  scheduledFor?: Date | string;
  performedAt?: Date | string;
  completedAt?: Date | string;
  reportedAt?: Date | string;
  indication: string;
  clinicalNotes?: string;
  technician?: string;
  radiologist?: string;
  report?: ImagingReport;
  images?: ImagingImage[];
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ImagingReport {
  findings: string;
  impression: string;
  recommendations?: string;
  reportedBy: string;
  reportedAt: Date | string;
  criticalFindings?: boolean;
}

export interface ImagingImage {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnail?: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date | string;
  description?: string;
  seriesNumber?: number;
  instanceNumber?: number;
}

export interface ImagingModalityConfig {
  modality: ImagingModality;
  name: string;
  description: string;
  icon: string;
  commonStudies: string[];
  typicalDuration: number; // in minutes
}

export const IMAGING_MODALITIES: Record<ImagingModality, ImagingModalityConfig> = {
  xray: {
    modality: 'xray',
    name: 'X-Ray',
    description: 'Radiographic imaging',
    icon: 'Film',
    commonStudies: ['Chest PA', 'Chest Lateral', 'Abdomen', 'Extremity', 'Spine'],
    typicalDuration: 15,
  },
  ct: {
    modality: 'ct',
    name: 'CT Scan',
    description: 'Computed Tomography',
    icon: 'Scan',
    commonStudies: ['Head', 'Chest', 'Abdomen', 'Pelvis', 'Spine'],
    typicalDuration: 30,
  },
  mri: {
    modality: 'mri',
    name: 'MRI',
    description: 'Magnetic Resonance Imaging',
    icon: 'Magnet',
    commonStudies: ['Brain', 'Spine', 'Musculoskeletal', 'Abdomen'],
    typicalDuration: 45,
  },
  ultrasound: {
    modality: 'ultrasound',
    name: 'Ultrasound',
    description: 'Sonography',
    icon: 'Waves',
    commonStudies: ['Abdomen', 'Pelvis', 'Obstetric', 'Vascular', 'Soft Tissue'],
    typicalDuration: 20,
  },
  ecg: {
    modality: 'ecg',
    name: 'ECG',
    description: 'Electrocardiogram',
    icon: 'Activity',
    commonStudies: ['12-Lead ECG', 'Rhythm Strip'],
    typicalDuration: 10,
  },
  echo: {
    modality: 'echo',
    name: 'Echocardiogram',
    description: 'Cardiac Ultrasound',
    icon: 'Heart',
    commonStudies: ['Transthoracic Echo', 'Stress Echo'],
    typicalDuration: 30,
  },
  other: {
    modality: 'other',
    name: 'Other',
    description: 'Other imaging modality',
    icon: 'Image',
    commonStudies: [],
    typicalDuration: 30,
  },
};








