import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { MedplumClient } from '@medplum/core';

type ConsultationData = {
  id: string;
  patientName: string;
  patientIc: string;
  patientDob?: string;
  patientGender?: string;
  patientPhone?: string;
  patientAddress?: string;
  consultationDate: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
};

/**
 * Get authenticated Medplum client using client_credentials
 */
async function getMedplumClient(): Promise<MedplumClient> {
  const baseUrl = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET must be set');
  }

  const medplum = new MedplumClient({
    baseUrl,
    clientId,
    clientSecret,
  });

  await medplum.startClientLogin(clientId, clientSecret);
  
  console.log('✅ Authenticated with Medplum using client_credentials');
  
  return medplum;
}

/**
 * Export Firebase consultations to Medplum as FHIR resources
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action !== 'export_all') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get Medplum client with OAuth2 credentials
    const medplum = await getMedplumClient();

    // Fetch all consultations from Firebase
    const consultationsSnapshot = await adminDb.collection('consultations').get();
    const consultations: ConsultationData[] = [];

    consultationsSnapshot.forEach((doc) => {
      consultations.push({ id: doc.id, ...doc.data() } as ConsultationData);
    });

    console.log(`📦 Found ${consultations.length} consultations to export`);

    const results = {
      total: consultations.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>,
    };

    // Export each consultation
    for (const consultation of consultations) {
      try {
        // 1. Create or get Patient resource
        const patientResponse = await medplum.searchOne('Patient', {
          identifier: consultation.patientIc,
        });

        let patient = patientResponse;
        if (!patient) {
          patient = await medplum.createResource({
            resourceType: 'Patient',
            identifier: [
              {
                system: 'urn:ic',
                value: consultation.patientIc,
              },
            ],
            name: [
              {
                text: consultation.patientName,
                family: consultation.patientName.split(' ').pop(),
                given: consultation.patientName.split(' ').slice(0, -1),
              },
            ],
            birthDate: consultation.patientDob,
            gender: consultation.patientGender?.toLowerCase() as 'male' | 'female' | 'other',
            telecom: consultation.patientPhone
              ? [{ system: 'phone', value: consultation.patientPhone }]
              : undefined,
            address: consultation.patientAddress
              ? [{ text: consultation.patientAddress }]
              : undefined,
          });
          console.log(`✅ Created Patient: ${(patient as any).id}`);
        }

        // 2. Create Encounter resource
        const encounter = await medplum.createResource({
          resourceType: 'Encounter',
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'ambulatory',
          },
          subject: {
            reference: `Patient/${(patient as any).id}`,
            display: consultation.patientName,
          },
          period: {
            start: consultation.consultationDate,
            end: consultation.consultationDate,
          },
        });
        console.log(`✅ Created Encounter: ${(encounter as any).id}`);

        // 3. Create Condition (Diagnosis) resource
        if (consultation.diagnosis) {
          const condition = await medplum.createResource({
            resourceType: 'Condition',
            subject: {
              reference: `Patient/${(patient as any).id}`,
            },
            encounter: {
              reference: `Encounter/${(encounter as any).id}`,
            },
            code: {
              text: consultation.diagnosis,
            },
            recordedDate: consultation.consultationDate,
          });
          console.log(`✅ Created Condition: ${(condition as any).id}`);
        }

        // 4. Create Procedure (Treatment) resource
        if (consultation.treatment) {
          const procedure = await medplum.createResource({
            resourceType: 'Procedure',
            status: 'completed',
            subject: {
              reference: `Patient/${(patient as any).id}`,
            },
            encounter: {
              reference: `Encounter/${(encounter as any).id}`,
            },
            code: {
              text: consultation.treatment,
            },
            performedDateTime: consultation.consultationDate,
          });
          console.log(`✅ Created Procedure: ${(procedure as any).id}`);
        }

        // 5. Create Observation (Notes) if present
        if (consultation.notes) {
          const observation = await medplum.createResource({
            resourceType: 'Observation',
            status: 'final',
            subject: {
              reference: `Patient/${(patient as any).id}`,
            },
            encounter: {
              reference: `Encounter/${(encounter as any).id}`,
            },
            code: {
              text: 'Clinical Notes',
            },
            valueString: consultation.notes,
            effectiveDateTime: consultation.consultationDate,
          });
          console.log(`✅ Created Observation: ${(observation as any).id}`);
        }

        // 6. Create MedicationRequest resources
        if (consultation.medications && consultation.medications.length > 0) {
          for (const med of consultation.medications) {
            const medicationRequest = await medplum.createResource({
              resourceType: 'MedicationRequest',
              status: 'active',
              intent: 'order',
              subject: {
                reference: `Patient/${(patient as any).id}`,
              },
              encounter: {
                reference: `Encounter/${(encounter as any).id}`,
              },
              medicationCodeableConcept: {
                text: med.name,
              },
              dosageInstruction: [
                {
                  text: `${med.dosage} - ${med.frequency} for ${med.duration}`,
                  timing: {
                    repeat: {
                      frequency: 1,
                      period: 1,
                      periodUnit: 'd',
                    },
                  },
                  doseAndRate: [
                    {
                      doseQuantity: {
                        value: parseFloat(med.dosage) || 1,
                        unit: 'tablet',
                      },
                    },
                  ],
                },
              ],
              authoredOn: consultation.consultationDate,
            });
            console.log(`✅ Created MedicationRequest: ${(medicationRequest as any).id}`);
          }
        }

        results.successful++;
        console.log(`✅ Successfully exported consultation ${consultation.id}`);
      } catch (error: any) {
        results.failed++;
        const errorMsg = error.message || String(error);
        results.errors.push({ id: consultation.id, error: errorMsg });
        console.error(`❌ Failed to export consultation ${consultation.id}:`, errorMsg);
      }
    }

    console.log('📊 Export Summary:', results);

    return NextResponse.json({
      success: true,
      message: `Exported ${results.successful}/${results.total} consultations`,
      results,
    });
  } catch (error: any) {
    console.error('❌ Export failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export consultations',
      },
      { status: 500 }
    );
  }
}

