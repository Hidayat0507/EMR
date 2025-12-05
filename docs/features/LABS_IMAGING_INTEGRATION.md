# POCT Labs & PACS Integration Guide

## Overview

This EMR system provides comprehensive integration with:
- **POCT (Point-of-Care Testing)** systems for laboratory tests
- **PACS (Picture Archiving and Communication System)** for medical imaging

All lab and imaging data is stored as FHIR resources in Medplum, ensuring interoperability and standards compliance.

## Table of Contents

1. [Architecture](#architecture)
2. [Lab Integration (POCT)](#lab-integration-poct)
3. [Imaging Integration (PACS)](#imaging-integration-pacs)
4. [API Reference](#api-reference)
5. [UI Components](#ui-components)
6. [Integration Examples](#integration-examples)
7. [Security & Compliance](#security--compliance)

## Architecture

### FHIR Resources Used

#### Laboratory Tests
- **ServiceRequest**: Lab orders from clinicians
- **DiagnosticReport**: Lab results summary
- **Observation**: Individual test results with values and interpretations

#### Imaging Studies
- **ServiceRequest**: Imaging orders from clinicians
- **ImagingStudy**: DICOM study metadata and series information
- **DiagnosticReport**: Radiologist interpretations and findings

### Data Flow

```
┌─────────────────┐
│   EMR System    │
│  (Next.js App)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────┐
│  Medplum FHIR   │←────→│  POCT Device │
│     Server      │      └──────────────┘
└────────┬────────┘
         │              ┌──────────────┐
         └─────────────→│ PACS System  │
                        └──────────────┘
```

## Lab Integration (POCT)

### Supported Test Categories

The system includes 40+ common POCT tests organized by category:

1. **Hematology**: CBC, Hemoglobin, Hematocrit, WBC, Platelet
2. **Chemistry**: Glucose, HbA1c, Creatinine, BUN, Electrolytes
3. **Lipid Panel**: Cholesterol, HDL, LDL, Triglycerides
4. **Liver Function**: ALT, AST, Bilirubin
5. **Cardiac**: Troponin, BNP
6. **Infectious Disease**: COVID-19 PCR/Antigen, Strep A
7. **Urinalysis**: Urine Protein, Glucose, Complete UA

### Ordering Lab Tests

#### From UI
1. Navigate to patient record
2. Go to "Labs & Imaging" tab
3. Select desired tests
4. Set priority (Routine, Urgent, STAT)
5. Add clinical notes
6. Submit order

#### Programmatically
```typescript
import { createLabOrder } from '@/lib/fhir/lab-service';

const orderId = await createLabOrder({
  patientId: 'patient-123',
  encounterId: 'encounter-456', // optional
  tests: ['GLUCOSE', 'HBA1C'],
  priority: 'routine',
  clinicalNotes: 'Diabetes follow-up',
  orderedBy: 'Dr. Smith',
});
```

### Receiving Lab Results from POCT

POCT devices can send results via API:

```bash
curl -X POST https://your-emr.com/api/labs/receive \
  -H "Content-Type: application/json" \
  -d '{
    "serviceRequestId": "service-request-id",
    "apiKey": "your-poct-api-key",
    "results": [
      {
        "testCode": "2339-0",
        "testName": "Glucose",
        "value": 95,
        "unit": "mg/dL",
        "referenceRange": "70-100 mg/dL",
        "interpretation": "normal",
        "status": "final"
      }
    ]
  }'
```

### Viewing Lab Results

Lab results are automatically displayed with:
- Color-coded interpretations (normal, high, low, critical)
- Reference ranges
- Test status (preliminary, final, corrected)
- Visual indicators for abnormal values
- Trend analysis (future enhancement)

## Imaging Integration (PACS)

### Supported Imaging Modalities

1. **X-Ray (DX/CR)**: Chest, Abdomen, Spine, Extremities
2. **CT Scan**: Head, Chest, Abdomen, Angiography
3. **MRI**: Brain, Spine, Joints
4. **Ultrasound**: Abdomen, Pelvis, Obstetric, Cardiac Echo
5. **Mammography**: Screening and Diagnostic

### Ordering Imaging Studies

#### From UI
1. Navigate to patient record
2. Go to "Labs & Imaging" tab
3. Switch to "Imaging Studies" tab
4. Select imaging procedure(s)
5. Set priority
6. **Required**: Enter clinical indication
7. Optional: Enter clinical question for radiologist
8. Submit order

#### Programmatically
```typescript
import { createImagingOrder } from '@/lib/fhir/imaging-service';

const orderId = await createImagingOrder({
  patientId: 'patient-123',
  encounterId: 'encounter-456',
  procedures: ['CHEST_XRAY_2V'],
  priority: 'urgent',
  clinicalIndication: 'Suspected pneumonia, fever x3 days',
  clinicalQuestion: 'Rule out consolidation?',
  orderedBy: 'Dr. Smith',
});
```

### Receiving Imaging Studies from PACS

When PACS completes a study, it can send metadata via API:

```bash
curl -X POST https://your-emr.com/api/imaging/receive \
  -H "Content-Type: application/json" \
  -d '{
    "serviceRequestId": "service-request-id",
    "apiKey": "your-pacs-api-key",
    "study": {
      "studyUid": "1.2.840.113619.2.55.3.xxx",
      "accessionNumber": "ACC-2024-001",
      "modality": "DX",
      "description": "Chest X-ray 2 views",
      "numberOfSeries": 2,
      "numberOfInstances": 4,
      "started": "2024-12-01T10:30:00Z",
      "series": [
        {
          "uid": "1.2.840.113619.2.55.3.xxx.1",
          "number": 1,
          "modality": "DX",
          "description": "PA View",
          "numberOfInstances": 2,
          "bodySite": "Chest"
        }
      ],
      "pacsUrl": "https://pacs.example.com/viewer?studyUid=xxx"
    }
  }'
```

### Radiologist Reports

Radiologists can submit interpretations via API:

```bash
curl -X POST https://your-emr.com/api/imaging/report \
  -H "Content-Type: application/json" \
  -d '{
    "imagingStudyId": "imaging-study-id",
    "apiKey": "your-pacs-api-key",
    "findings": "The lungs are clear without focal consolidation...",
    "impression": "Normal chest radiograph. No acute cardiopulmonary abnormality.",
    "status": "final",
    "radiologist": "Dr. Jane Smith, MD"
  }'
```

## API Reference

### Lab APIs

#### POST /api/labs/order
Order laboratory tests.

**Request Body:**
```typescript
{
  patientId: string;
  encounterId?: string;
  tests: LabTestCode[];
  priority?: 'routine' | 'urgent' | 'stat';
  clinicalNotes?: string;
}
```

#### POST /api/labs/receive
Receive lab results from POCT system.

**Request Body:**
```typescript
{
  serviceRequestId: string;
  apiKey?: string;
  results: LabResult[];
  conclusion?: string;
}
```

#### GET /api/labs/results
Get lab results for a patient or encounter.

**Query Parameters:**
- `patientId`: FHIR Patient ID
- `encounterId`: FHIR Encounter ID (alternative)

### Imaging APIs

#### POST /api/imaging/order
Order imaging studies.

**Request Body:**
```typescript
{
  patientId: string;
  encounterId?: string;
  procedures: ImagingProcedureCode[];
  priority?: 'routine' | 'urgent' | 'stat';
  clinicalIndication: string; // Required
  clinicalQuestion?: string;
}
```

#### POST /api/imaging/receive
Receive imaging study from PACS.

**Request Body:**
```typescript
{
  serviceRequestId: string;
  apiKey?: string;
  study: ImagingStudyData;
}
```

#### POST /api/imaging/report
Submit radiology report.

**Request Body:**
```typescript
{
  imagingStudyId: string;
  apiKey?: string;
  findings: string;
  impression: string;
  status?: 'preliminary' | 'final';
  radiologist?: string;
}
```

#### GET /api/imaging/results
Get imaging studies for a patient or encounter.

**Query Parameters:**
- `patientId`: FHIR Patient ID
- `encounterId`: FHIR Encounter ID (alternative)

## UI Components

### Lab Components

#### `<LabOrderForm>`
Form for ordering laboratory tests with category-based selection.

```tsx
<LabOrderForm 
  patientId="patient-123"
  encounterId="encounter-456"
  onOrderPlaced={(orderId) => console.log('Order placed:', orderId)}
/>
```

#### `<LabResultsView>`
Display lab results with interpretations and reference ranges.

```tsx
<LabResultsView 
  patientId="patient-123"
  encounterId="encounter-456" // optional, filters to encounter
/>
```

### Imaging Components

#### `<ImagingOrderForm>`
Form for ordering imaging studies with clinical indication.

```tsx
<ImagingOrderForm 
  patientId="patient-123"
  encounterId="encounter-456"
  onOrderPlaced={(orderId) => console.log('Order placed:', orderId)}
/>
```

#### `<ImagingResultsView>`
Display imaging studies with radiology reports and PACS links.

```tsx
<ImagingResultsView 
  patientId="patient-123"
  encounterId="encounter-456" // optional
/>
```

## Integration Examples

### HL7 v2.x Integration

For legacy systems using HL7 v2.x messages, use a middleware like Mirth Connect to convert messages to FHIR:

```
HL7 ORM (Order) → Mirth → FHIR ServiceRequest → EMR API
HL7 ORU (Result) → Mirth → FHIR DiagnosticReport → EMR API
```

### DICOM Integration

PACS systems typically support:

1. **DICOM Modality Worklist (MWL)**: EMR can provide worklists to imaging devices
2. **DICOM Store (C-STORE)**: Images sent from modality to PACS
3. **WADO-RS**: Web-based DICOM viewing (recommended)
4. **DICOMweb**: Modern REST API for DICOM

### Webhook Notifications

Configure your POCT/PACS systems to send webhooks when results are available:

```javascript
// Example webhook handler
app.post('/webhooks/lab-complete', async (req, res) => {
  const { orderId, status } = req.body;
  
  // Fetch results from POCT system
  const results = await fetchFromPOCT(orderId);
  
  // Send to EMR
  await fetch('/api/labs/receive', {
    method: 'POST',
    body: JSON.stringify({
      serviceRequestId: orderId,
      results,
    }),
  });
  
  res.json({ received: true });
});
```

## Security & Compliance

### Authentication

API endpoints accept an `apiKey` parameter for external system authentication:

1. Generate API keys in environment variables:
   ```bash
   POCT_API_KEY=your-secure-poct-key
   PACS_API_KEY=your-secure-pacs-key
   ```

2. External systems include key in requests:
   ```json
   {
     "apiKey": "your-secure-poct-key",
     ...
   }
   ```

### HIPAA Compliance

- All data encrypted in transit (HTTPS/TLS)
- All data encrypted at rest in Medplum
- Audit logs maintained for all access
- Role-based access control (RBAC)
- Patient consent management

### Data Retention

- Lab results: Retained indefinitely (medical record)
- Imaging studies: Metadata retained indefinitely, images per policy
- Audit logs: 7 years minimum

## Best Practices

1. **Always provide clinical indication** for imaging orders (required by many insurance providers)

2. **Use STAT priority appropriately** - reserve for true emergencies

3. **Review critical results immediately** - system highlights critical values

4. **Link orders to encounters** when possible for better context

5. **Include reference ranges** in lab results for proper interpretation

6. **Use standard LOINC codes** for lab tests to ensure interoperability

7. **Follow DICOM standards** for imaging to ensure compatibility

## Troubleshooting

### Common Issues

**Problem**: Lab results not appearing
- Check ServiceRequest ID is correct
- Verify POCT system has correct API endpoint
- Check API key is valid
- Review server logs for errors

**Problem**: PACS images not viewable
- Verify WADO-RS endpoint is accessible
- Check CORS settings for PACS viewer
- Ensure DICOM UIDs are correct
- Test PACS URL directly in browser

**Problem**: Order not created
- Check patient ID exists in Medplum
- Verify Medplum credentials are configured
- Review network connectivity to Medplum server

## Future Enhancements

- [ ] Result trending and graphing
- [ ] Automatic critical value alerts
- [ ] Reference range customization by age/gender
- [ ] Embedded DICOM viewer (OHIF Viewer)
- [ ] Structured report templates
- [ ] AI-assisted result interpretation
- [ ] Mobile app for result viewing
- [ ] SMS notifications for critical results

## Support

For questions or issues:
- Check logs: `/var/log/emr/`
- Review Medplum console: `https://your-medplum-url/admin`
- Contact support: support@your-emr.com

---

Last Updated: December 1, 2024

