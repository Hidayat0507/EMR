/**
 * Lab Service - POCT (Point-of-Care Testing) Integration
 * 
 * Handles lab orders and results using FHIR resources:
 * - ServiceRequest: Lab orders
 * - DiagnosticReport: Lab results
 * - Observation: Individual test results
 */

import { MedplumClient } from '@medplum/core';
import type {
  ServiceRequest,
  DiagnosticReport,
  Observation,
  Patient as FHIRPatient,
} from '@medplum/fhirtypes';

/**
 * Lab test catalog (restricted to required panels)
 * LOINC panels chosen for FHIR ServiceRequest coding.
 */
export const LAB_TESTS = {
  CBC: { code: '58410-2', display: 'Complete Blood Count (CBC) panel', system: 'http://loinc.org' },
  RENAL_PROFILE: { code: '24323-8', display: 'Basic metabolic/renal panel', system: 'http://loinc.org' },
  LFT: { code: '24325-3', display: 'Hepatic function (LFT) panel', system: 'http://loinc.org' },
} as const;

export type LabTestCode = keyof typeof LAB_TESTS;

export interface LabOrderRequest {
  patientId: string; // FHIR Patient ID
  encounterId?: string; // FHIR Encounter ID
  tests: LabTestCode[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  clinicalNotes?: string;
  orderedBy?: string;
}

export interface LabResult {
  testCode: string;
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  interpretation?: 'normal' | 'high' | 'low' | 'critical';
  status: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  performedAt?: Date;
}

export interface LabReportSummary {
  id: string;
  patientId: string;
  patientName?: string;
  encounterId?: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  orderedAt: Date;
  issuedAt?: Date;
  results: LabResult[];
  conclusion?: string;
  orderingPhysician?: string;
}

let medplumClient: MedplumClient | undefined;
let medplumInitPromise: Promise<MedplumClient> | undefined;

/**
 * Get authenticated Medplum client (singleton)
 */
async function getMedplumClient(): Promise<MedplumClient> {
  if (medplumClient) return medplumClient;
  if (medplumInitPromise) return medplumInitPromise;

  const baseUrl = process.env.MEDPLUM_BASE_URL || process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Medplum credentials not configured');
  }

  medplumInitPromise = (async () => {
    const medplum = new MedplumClient({
      baseUrl,
      clientId,
      clientSecret,
    });
    await medplum.startClientLogin(clientId, clientSecret);
    medplumClient = medplum;
    return medplum;
  })();

  return medplumInitPromise;
}

/**
 * Create a lab order (ServiceRequest)
 */
export async function createLabOrder(order: LabOrderRequest): Promise<string> {
  const medplum = await getMedplumClient();
  
  console.log(`📋 Creating lab order for patient ${order.patientId}`);

  // Create a ServiceRequest for each test
  const serviceRequests: ServiceRequest[] = [];
  
  for (const testCode of order.tests) {
    const test = LAB_TESTS[testCode];
    
    const serviceRequest = await medplum.createResource<ServiceRequest>({
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      priority: order.priority || 'routine',
      code: {
        coding: [{
          system: test.system,
          code: test.code,
          display: test.display,
        }],
        text: test.display,
      },
      subject: {
        reference: `Patient/${order.patientId}`,
      },
      encounter: order.encounterId ? {
        reference: `Encounter/${order.encounterId}`,
      } : undefined,
      authoredOn: new Date().toISOString(),
      requester: order.orderedBy ? {
        display: order.orderedBy,
      } : undefined,
      note: order.clinicalNotes ? [{
        text: order.clinicalNotes,
      }] : undefined,
    });
    
    serviceRequests.push(serviceRequest);
    console.log(`✅ Created ServiceRequest: ${serviceRequest.id} for ${test.display}`);
  }

  // Return the first service request ID (or you could return all IDs)
  return serviceRequests[0]?.id || '';
}

/**
 * Receive lab results from POCT system and create DiagnosticReport + Observations
 */
export async function receiveLabResults(
  serviceRequestId: string,
  results: LabResult[],
  conclusion?: string
): Promise<string> {
  const medplum = await getMedplumClient();
  
  console.log(`📊 Receiving lab results for ServiceRequest ${serviceRequestId}`);

  // Get the original service request
  const serviceRequest = await medplum.readResource('ServiceRequest', serviceRequestId);
  
  if (!serviceRequest.subject?.reference) {
    throw new Error('ServiceRequest has no patient reference');
  }

  // Create Observation for each result
  const observations: Observation[] = [];
  
  for (const result of results) {
    const observation = await medplum.createResource<Observation>({
      resourceType: 'Observation',
      status: result.status as any,
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: result.testCode,
          display: result.testName,
        }],
        text: result.testName,
      },
      subject: {
        reference: serviceRequest.subject.reference,
      },
      encounter: serviceRequest.encounter,
      effectiveDateTime: result.performedAt?.toISOString() || new Date().toISOString(),
      issued: new Date().toISOString(),
      valueQuantity: typeof result.value === 'number' ? {
        value: result.value,
        unit: result.unit,
      } : undefined,
      valueString: typeof result.value === 'string' ? result.value : undefined,
      referenceRange: result.referenceRange ? [{
        text: result.referenceRange,
      }] : undefined,
      interpretation: result.interpretation ? [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: result.interpretation === 'normal' ? 'N' : 
                result.interpretation === 'high' ? 'H' : 
                result.interpretation === 'low' ? 'L' : 'A',
          display: result.interpretation,
        }],
      }] : undefined,
    });
    
    observations.push(observation);
    console.log(`✅ Created Observation: ${observation.id} for ${result.testName}`);
  }

  // Create DiagnosticReport
  const diagnosticReport = await medplum.createResource<DiagnosticReport>({
    resourceType: 'DiagnosticReport',
    status: results.every(r => r.status === 'final') ? 'final' : 'partial',
    code: serviceRequest.code || { text: 'Laboratory Report' },
    subject: {
      reference: serviceRequest.subject.reference,
    },
    encounter: serviceRequest.encounter,
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    result: observations.map(obs => ({
      reference: `Observation/${obs.id}`,
    })),
    conclusion: conclusion,
    basedOn: [{
      reference: `ServiceRequest/${serviceRequestId}`,
    }],
  });

  console.log(`✅ Created DiagnosticReport: ${diagnosticReport.id}`);

  // Update ServiceRequest status to completed
  await medplum.updateResource({
    ...serviceRequest,
    status: 'completed',
  });

  return diagnosticReport.id!;
}

/**
 * Get all lab orders for a patient
 */
export async function getPatientLabOrders(patientId: string): Promise<ServiceRequest[]> {
  const medplum = await getMedplumClient();
  
  const orders = await medplum.searchResources('ServiceRequest', {
    subject: `Patient/${patientId}`,
    category: 'laboratory',
    _sort: '-authored',
  });

  return orders;
}

/**
 * Get all lab results for a patient
 */
export async function getPatientLabResults(patientId: string): Promise<LabReportSummary[]> {
  const medplum = await getMedplumClient();
  
  const reports = await medplum.searchResources('DiagnosticReport', {
    subject: `Patient/${patientId}`,
    _sort: '-issued',
  });

  const summaries: LabReportSummary[] = [];

  for (const report of reports) {
    const results: LabResult[] = [];
    
    // Get all observations in the report
    if (report.result) {
      for (const resultRef of report.result) {
        const obsId = resultRef.reference?.split('/')[1];
        if (obsId) {
          const obs = await medplum.readResource('Observation', obsId);
          
          results.push({
            testCode: obs.code?.coding?.[0]?.code || '',
            testName: obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown',
            value: (obs as any).valueQuantity?.value || (obs as any).valueString || 'N/A',
            unit: (obs as any).valueQuantity?.unit,
            referenceRange: obs.referenceRange?.[0]?.text,
            interpretation: obs.interpretation?.[0]?.coding?.[0]?.display as any,
            status: obs.status as any,
            performedAt: obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : undefined,
          });
        }
      }
    }

    summaries.push({
      id: report.id!,
      patientId,
      patientName: report.subject?.display,
      encounterId: report.encounter?.reference?.split('/')[1],
      status: report.status as any,
      orderedAt: report.effectiveDateTime ? new Date(report.effectiveDateTime) : new Date(),
      issuedAt: report.issued ? new Date(report.issued) : undefined,
      results,
      conclusion: report.conclusion,
    });
  }

  return summaries;
}

/**
 * Get a specific lab report by ID
 */
export async function getLabReport(reportId: string): Promise<LabReportSummary | null> {
  try {
    const medplum = await getMedplumClient();
    
    const report = await medplum.readResource('DiagnosticReport', reportId);
    const results: LabResult[] = [];
    
    // Get all observations
    if (report.result) {
      for (const resultRef of report.result) {
        const obsId = resultRef.reference?.split('/')[1];
        if (obsId) {
          const obs = await medplum.readResource('Observation', obsId);
          
          results.push({
            testCode: obs.code?.coding?.[0]?.code || '',
            testName: obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown',
            value: (obs as any).valueQuantity?.value || (obs as any).valueString || 'N/A',
            unit: (obs as any).valueQuantity?.unit,
            referenceRange: obs.referenceRange?.[0]?.text,
            interpretation: obs.interpretation?.[0]?.coding?.[0]?.display as any,
            status: obs.status as any,
            performedAt: obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : undefined,
          });
        }
      }
    }

    return {
      id: report.id!,
      patientId: report.subject?.reference?.split('/')[1] || '',
      patientName: report.subject?.display,
      encounterId: report.encounter?.reference?.split('/')[1],
      status: report.status as any,
      orderedAt: report.effectiveDateTime ? new Date(report.effectiveDateTime) : new Date(),
      issuedAt: report.issued ? new Date(report.issued) : undefined,
      results,
      conclusion: report.conclusion,
    };
  } catch (error) {
    console.error('Failed to get lab report:', error);
    return null;
  }
}

/**
 * Get lab results for an encounter
 */
export async function getEncounterLabResults(encounterId: string): Promise<LabReportSummary[]> {
  const medplum = await getMedplumClient();
  
  const reports = await medplum.searchResources('DiagnosticReport', {
    encounter: `Encounter/${encounterId}`,
    _sort: '-issued',
  });

  const summaries: LabReportSummary[] = [];

  for (const report of reports) {
    const results: LabResult[] = [];
    
    if (report.result) {
      for (const resultRef of report.result) {
        const obsId = resultRef.reference?.split('/')[1];
        if (obsId) {
          const obs = await medplum.readResource('Observation', obsId);
          
          results.push({
            testCode: obs.code?.coding?.[0]?.code || '',
            testName: obs.code?.text || obs.code?.coding?.[0]?.display || 'Unknown',
            value: (obs as any).valueQuantity?.value || (obs as any).valueString || 'N/A',
            unit: (obs as any).valueQuantity?.unit,
            referenceRange: obs.referenceRange?.[0]?.text,
            interpretation: obs.interpretation?.[0]?.coding?.[0]?.display as any,
            status: obs.status as any,
            performedAt: obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : undefined,
          });
        }
      }
    }

    summaries.push({
      id: report.id!,
      patientId: report.subject?.reference?.split('/')[1] || '',
      patientName: report.subject?.display,
      encounterId,
      status: report.status as any,
      orderedAt: report.effectiveDateTime ? new Date(report.effectiveDateTime) : new Date(),
      issuedAt: report.issued ? new Date(report.issued) : undefined,
      results,
      conclusion: report.conclusion,
    });
  }

  return summaries;
}






