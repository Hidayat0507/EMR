#!/usr/bin/env bun

/**
 * Test script for Labs & Imaging Integration
 * 
 * Run with: bun run scripts/test-lab-imaging-integration.ts
 */

import { createLabOrder, receiveLabResults } from '../lib/fhir/lab-service';
import { createImagingOrder, receiveImagingStudy } from '../lib/fhir/imaging-service';

async function testLabIntegration() {
  console.log('\n🧪 Testing Lab Integration...\n');

  try {
    // Step 1: Create a lab order
    console.log('1️⃣  Creating lab order...');
    const serviceRequestId = await createLabOrder({
      patientId: 'test-patient-123', // Replace with actual patient ID
      tests: ['GLUCOSE', 'HBA1C', 'CHOLESTEROL'],
      priority: 'routine',
      clinicalNotes: 'Annual diabetes screening',
      orderedBy: 'Dr. Test Smith',
    });
    console.log(`✅ Lab order created: ${serviceRequestId}\n`);

    // Step 2: Simulate receiving results from POCT
    console.log('2️⃣  Simulating POCT results...');
    const reportId = await receiveLabResults(serviceRequestId, [
      {
        testCode: '2339-0',
        testName: 'Glucose',
        value: 98,
        unit: 'mg/dL',
        referenceRange: '70-100 mg/dL',
        interpretation: 'normal',
        status: 'final',
        performedAt: new Date(),
      },
      {
        testCode: '4548-4',
        testName: 'Hemoglobin A1c',
        value: 5.4,
        unit: '%',
        referenceRange: '< 5.7%',
        interpretation: 'normal',
        status: 'final',
        performedAt: new Date(),
      },
      {
        testCode: '2093-3',
        testName: 'Total Cholesterol',
        value: 195,
        unit: 'mg/dL',
        referenceRange: '< 200 mg/dL',
        interpretation: 'normal',
        status: 'final',
        performedAt: new Date(),
      },
    ], 'All tests within normal limits. Continue current management.');
    console.log(`✅ Lab results received: ${reportId}\n`);

    console.log('✅ Lab integration test PASSED\n');
  } catch (error: any) {
    console.error('❌ Lab integration test FAILED:', error.message);
    throw error;
  }
}

async function testImagingIntegration() {
  console.log('\n📸 Testing Imaging Integration...\n');

  try {
    // Step 1: Create an imaging order
    console.log('1️⃣  Creating imaging order...');
    const serviceRequestId = await createImagingOrder({
      patientId: 'test-patient-123', // Replace with actual patient ID
      procedures: ['CHEST_XRAY_2V'],
      priority: 'urgent',
      clinicalIndication: 'Suspected pneumonia, fever x3 days, cough',
      clinicalQuestion: 'Rule out consolidation or pleural effusion',
      orderedBy: 'Dr. Test Smith',
    });
    console.log(`✅ Imaging order created: ${serviceRequestId}\n`);

    // Step 2: Simulate receiving study from PACS
    console.log('2️⃣  Simulating PACS study completion...');
    const studyId = await receiveImagingStudy(serviceRequestId, {
      studyUid: '1.2.840.113619.2.55.3.2831196886.123.1234567890.test',
      accessionNumber: 'ACC-TEST-001',
      modality: 'DX',
      description: 'Chest X-ray 2 views',
      numberOfSeries: 2,
      numberOfInstances: 4,
      started: new Date(),
      series: [
        {
          uid: '1.2.840.113619.2.55.3.2831196886.123.1234567890.test.1',
          number: 1,
          modality: 'DX',
          description: 'PA View',
          numberOfInstances: 2,
          bodySite: 'Chest',
          started: new Date(),
          endpoint: 'https://pacs.example.com/wado/series/1',
        },
        {
          uid: '1.2.840.113619.2.55.3.2831196886.123.1234567890.test.2',
          number: 2,
          modality: 'DX',
          description: 'Lateral View',
          numberOfInstances: 2,
          bodySite: 'Chest',
          started: new Date(),
          endpoint: 'https://pacs.example.com/wado/series/2',
        },
      ],
      pacsUrl: 'https://pacs.example.com/viewer?study=test',
    });
    console.log(`✅ Imaging study received: ${studyId}\n`);

    // Step 3: Simulate radiologist report
    console.log('3️⃣  Simulating radiologist report...');
    const { createImagingReport } = await import('../lib/fhir/imaging-service');
    const reportId = await createImagingReport(
      studyId,
      'The lungs are clear without focal consolidation, pleural effusion, or pneumothorax. The cardiac silhouette is normal in size. The mediastinal contours are unremarkable. The osseous structures are intact.',
      'Normal chest radiograph. No acute cardiopulmonary abnormality.',
      'final',
      'Dr. Test Radiologist, MD'
    );
    console.log(`✅ Radiology report created: ${reportId}\n`);

    console.log('✅ Imaging integration test PASSED\n');
  } catch (error: any) {
    console.error('❌ Imaging integration test FAILED:', error.message);
    throw error;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   Labs & Imaging Integration Test Suite         ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  try {
    // Test lab integration
    await testLabIntegration();

    // Test imaging integration
    await testImagingIntegration();

    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║   ✅ ALL TESTS PASSED                            ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log('📋 Next Steps:');
    console.log('1. Check Medplum console for created resources');
    console.log('2. Test the UI at /patients/[id]/labs-imaging');
    console.log('3. Configure your POCT/PACS systems');
    console.log('4. See docs/LABS_IMAGING_SETUP.md for details\n');

  } catch (error) {
    console.error('\n❌ Test suite failed\n');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export { testLabIntegration, testImagingIntegration };

