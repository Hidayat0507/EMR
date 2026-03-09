/**
 * POCT Module - FHIR-backed implementations.
 *
 * Stores point-of-care test orders/results as FHIR ServiceRequest / DiagnosticReport resources in Medplum.
 */

import { Buffer } from 'buffer';
import { MedplumClient } from '@medplum/core';
import type { DiagnosticReport, Observation, ServiceRequest } from '@medplum/fhirtypes';
import type { POCTTest, POCTTestResult } from './types';

let medplumClient: MedplumClient | undefined;
let medplumInitPromise: Promise<MedplumClient> | undefined;

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
    const medplum = new MedplumClient({ baseUrl, clientId, clientSecret });
    await medplum.startClientLogin(clientId, clientSecret);
    medplumClient = medplum;
    return medplum;
  })();

  return medplumInitPromise;
}

const STATUS_TO_SERVICEREQUEST: Record<POCTTest['status'], ServiceRequest['status']> = {
  pending: 'active',
  in_progress: 'active',
  completed: 'completed',
  cancelled: 'revoked',
};

const SERVICEREQUEST_TO_STATUS: Record<ServiceRequest['status'], POCTTest['status']> = {
  draft: 'pending',
  active: 'pending',
  'on-hold': 'pending',
  revoked: 'cancelled',
  completed: 'completed',
  'entered-in-error': 'cancelled',
  unknown: 'pending',
};

const POCT_TEST_CODING: Partial<Record<POCTTest['testType'], { system: string; code: string; display: string }>> = {
  blood_glucose: { system: 'http://loinc.org', code: '2339-0', display: 'Glucose [Mass/volume] in Blood' },
  urinalysis: { system: 'http://loinc.org', code: '24357-6', display: 'Urinalysis complete panel' },
  pregnancy: { system: 'http://loinc.org', code: '2106-3', display: 'Choriogonadotropin (pregnancy test) [Presence] in Urine' },
  strep_throat: { system: 'http://loinc.org', code: '60489-2', display: 'Streptococcus pyogenes Ag [Presence] in Throat' },
  influenza: { system: 'http://loinc.org', code: '80382-5', display: 'Influenza virus A and B Ag panel' },
  covid19: { system: 'http://loinc.org', code: '94558-4', display: 'SARS-CoV-2 Ag [Presence] in Respiratory specimen' },
  hemoglobin: { system: 'http://loinc.org', code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
  cholesterol: { system: 'http://loinc.org', code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' },
  inr: { system: 'http://loinc.org', code: '6301-6', display: 'INR in Platelet poor plasma' },
  troponin: { system: 'http://loinc.org', code: '10839-9', display: 'Troponin I [Mass/volume] in Serum or Plasma' },
  bnp: { system: 'http://loinc.org', code: '33762-6', display: 'BNP [Mass/volume] in Blood' },
};

function mapReportToResult(report?: DiagnosticReport): POCTTestResult | undefined {
  if (!report) return undefined;
  return {
    resultType: 'normal',
    findings: report.presentedForm?.[0]?.title || report.conclusion || undefined,
    interpretation: report.conclusion || undefined,
    numericValue: undefined,
    unit: undefined,
    referenceRange: undefined,
    attachments: report.presentedForm?.map((p) => p.url || '').filter(Boolean),
  };
}

function mapServiceRequestToPOCT(sr: ServiceRequest, report?: DiagnosticReport): POCTTest {
  const status = sr.status ? SERVICEREQUEST_TO_STATUS[sr.status] || 'pending' : 'pending';
  const patientId = sr.subject?.reference?.split('/')[1] || '';
  const consultationId = sr.encounter?.reference?.split('/')[1];
  const orderedAt = sr.authoredOn || sr.meta?.lastUpdated || new Date().toISOString();

  return {
    id: sr.id || '',
    patientId,
    patientName: sr.subject?.display,
    consultationId,
    testType: 'other',
    testName: sr.code?.text || sr.code?.coding?.[0]?.display || 'POCT Test',
    status,
    orderedBy: sr.requester?.display || 'Unknown',
    orderedAt,
    performedBy: report?.resultsInterpreter?.[0]?.display,
    performedAt: report?.effectiveDateTime,
    completedAt: status === 'completed' ? report?.issued || sr.meta?.lastUpdated : undefined,
    result: mapReportToResult(report),
    notes: sr.note?.map((n) => n.text).filter(Boolean).join(' | '),
    urgency: (sr.priority as POCTTest['urgency']) || 'routine',
    createdAt: orderedAt,
    updatedAt: sr.meta?.lastUpdated,
  };
}

async function findReportForRequest(medplum: MedplumClient, serviceRequestId: string): Promise<DiagnosticReport | undefined> {
  try {
    const reports = await medplum.searchResources<DiagnosticReport>('DiagnosticReport', {
      'based-on': `ServiceRequest/${serviceRequestId}`,
      _sort: '-issued',
      _count: '1',
    });
    return reports[0];
  } catch (error) {
    console.warn('Failed to find DiagnosticReport for ServiceRequest', serviceRequestId, error);
    return undefined;
  }
}

export async function createPOCTTest(
  testData: Omit<POCTTest, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const medplum = await getMedplumClient();
  const authoredOn = typeof testData.orderedAt === 'string' ? testData.orderedAt : testData.orderedAt?.toISOString() || new Date().toISOString();
  const status = STATUS_TO_SERVICEREQUEST[testData.status] || 'active';
  const coding = POCT_TEST_CODING[testData.testType];

  const sr = await medplum.createResource<ServiceRequest>({
    resourceType: 'ServiceRequest',
    status,
    intent: 'order',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/servicerequest-category',
            code: 'laboratory',
            display: 'Laboratory',
          },
        ],
      },
    ],
    priority: (testData.urgency as ServiceRequest['priority']) || 'routine',
    code: {
      coding: coding ? [coding] : undefined,
      text: testData.testName,
    },
    subject: { reference: `Patient/${testData.patientId}`, display: testData.patientName },
    encounter: testData.consultationId ? { reference: `Encounter/${testData.consultationId}` } : undefined,
    authoredOn,
    requester: testData.orderedBy ? { display: testData.orderedBy } : undefined,
    note: testData.notes ? [{ text: testData.notes }] : undefined,
  });

  if (!sr.id) {
    throw new Error('Failed to create POCT ServiceRequest');
  }
  return sr.id;
}

export async function getPOCTTestById(id: string): Promise<POCTTest | null> {
  const medplum = await getMedplumClient();
  try {
    const sr = await medplum.readResource<ServiceRequest>('ServiceRequest', id);
    const report = await findReportForRequest(medplum, id);
    return mapServiceRequestToPOCT(sr, report);
  } catch (err) {
    console.error('Failed to read POCT test from Medplum', err);
    return null;
  }
}

export async function getPOCTTestsByPatient(patientId: string): Promise<POCTTest[]> {
  const medplum = await getMedplumClient();
  try {
    let requests = await medplum.searchResources<ServiceRequest>('ServiceRequest', {
      subject: `Patient/${patientId}`,
      category: 'laboratory',
      _sort: '-authored',
    });
    if (requests.length === 0) {
      requests = await medplum.searchResources<ServiceRequest>('ServiceRequest', {
        subject: `Patient/${patientId}`,
        _sort: '-authored',
      });
    }

    const items: POCTTest[] = [];
    for (const sr of requests) {
      const report = await findReportForRequest(medplum, sr.id || '');
      items.push(mapServiceRequestToPOCT(sr, report));
    }
    return items;
  } catch (err) {
    console.error('Failed to list POCT tests from Medplum', err);
    return [];
  }
}

export async function getPOCTTestsByStatus(status: POCTTest['status']): Promise<POCTTest[]> {
  const medplum = await getMedplumClient();
  const srStatus = STATUS_TO_SERVICEREQUEST[status] || 'active';
  try {
    let requests = await medplum.searchResources<ServiceRequest>('ServiceRequest', {
      category: 'laboratory',
      status: srStatus,
      _sort: '-authored',
    });
    if (requests.length === 0) {
      requests = await medplum.searchResources<ServiceRequest>('ServiceRequest', {
        status: srStatus,
        _sort: '-authored',
      });
    }

    const items: POCTTest[] = [];
    for (const sr of requests) {
      const report = await findReportForRequest(medplum, sr.id || '');
      items.push(mapServiceRequestToPOCT(sr, report));
    }
    return items;
  } catch (err) {
    console.error('Failed to list POCT tests by status from Medplum', err);
    return [];
  }
}

export async function getTodaysPOCTTests(): Promise<POCTTest[]> {
  const medplum = await getMedplumClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.toISOString().split('T')[0];

  try {
    let requests = await medplum.searchResources<ServiceRequest>('ServiceRequest', {
      category: 'laboratory',
      authored: `ge${start}`,
      _sort: '-authored',
    });
    if (requests.length === 0) {
      requests = await medplum.searchResources<ServiceRequest>('ServiceRequest', {
        authored: `ge${start}`,
        _sort: '-authored',
      });
    }

    const items: POCTTest[] = [];
    for (const sr of requests) {
      const report = await findReportForRequest(medplum, sr.id || '');
      items.push(mapServiceRequestToPOCT(sr, report));
    }
    return items;
  } catch (err) {
    console.error('Failed to list today POCT tests from Medplum', err);
    return [];
  }
}

export async function updatePOCTTest(
  id: string,
  updates: Partial<POCTTest>
): Promise<void> {
  const medplum = await getMedplumClient();
  const sr = await medplum.readResource<ServiceRequest>('ServiceRequest', id);
  const status = updates.status ? STATUS_TO_SERVICEREQUEST[updates.status] : sr.status;

  await medplum.updateResource<ServiceRequest>({
    ...sr,
    status,
    priority: updates.urgency || sr.priority,
    note: updates.notes ? [{ text: updates.notes }] : sr.note,
  });
}

export async function completePOCTTest(
  id: string,
  result: POCTTest['result'],
  performedBy: string
): Promise<void> {
  const medplum = await getMedplumClient();
  const sr = await medplum.readResource<ServiceRequest>('ServiceRequest', id);

  await medplum.createResource<DiagnosticReport>({
    resourceType: 'DiagnosticReport',
    status: 'final',
    code: sr.code,
    subject: sr.subject,
    encounter: sr.encounter,
    basedOn: [{ reference: `ServiceRequest/${id}` }],
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    resultsInterpreter: performedBy ? [{ display: performedBy }] : undefined,
    conclusion: result?.interpretation || result?.findings,
    presentedForm: result?.findings
      ? [{ contentType: 'text/plain', data: Buffer.from(result.findings, 'utf-8').toString('base64'), title: 'POCT Findings' }]
      : undefined,
  });

  await medplum.updateResource<ServiceRequest>({
    ...sr,
    status: 'completed',
  });
}
