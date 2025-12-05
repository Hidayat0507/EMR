# Triage System for UCC EMR

## Overview

The triage system allows medical staff to assess and prioritize patients based on the severity of their condition. This is a critical component of urgent care operations, ensuring that the most critical patients receive care first.

## Features

### 1. **Five-Level Triage System**

Based on the Australian Triage Scale (ATS), the system uses 5 acuity levels:

| Level | Label | Color | Description | Expected Wait Time |
|-------|-------|-------|-------------|-------------------|
| 1 | Resuscitation | Red | Immediate life-threatening | Immediate |
| 2 | Emergency | Orange | Imminently life-threatening | 10 minutes |
| 3 | Urgent | Yellow | Potentially life-threatening | 30 minutes |
| 4 | Semi-Urgent | Green | Potentially serious | 60 minutes |
| 5 | Non-Urgent | Blue | Less urgent | 120 minutes |

### 2. **Comprehensive Vital Signs Recording**

The system captures:
- **Blood Pressure** (Systolic/Diastolic in mmHg)
- **Heart Rate** (bpm)
- **Respiratory Rate** (breaths/min)
- **Temperature** (°C)
- **Oxygen Saturation** (SpO2 %)
- **Pain Score** (0-10 scale)
- **Weight** (kg)
- **Height** (cm)

### 3. **Red Flags / Warning Signs**

Quick-select badges for common warning signs:
- Chest pain
- Difficulty breathing
- Severe bleeding
- Altered consciousness
- Severe pain
- Suspected stroke
- Severe allergic reaction
- Head injury
- Abdominal pain
- Fever with confusion

### 4. **Chief Complaint Tracking**

Records the primary reason for the patient's visit, which is displayed in the queue.

### 5. **Priority-Based Queue Management**

The queue automatically sorts patients by:
1. **Triage Level** (1 = highest priority)
2. **Queue Time** (within same triage level, FIFO)

### 6. **Medical Alert Integration**

The triage page displays patient allergies and conditions for safety.

## How to Use

### Performing Triage

1. **Navigate to Patient**:
   - From the Patients page, click on a patient
   - Click the "Triage" button in the top right
   
   OR
   
   - From the Patients list, use the dropdown menu and select "Perform Triage"

2. **Complete the Triage Form**:
   - **Select Triage Level**: Choose from 1-5 based on patient condition
   - **Enter Chief Complaint**: Required - describe the main reason for visit
   - **Record Vital Signs**: Enter available measurements
   - **Select Red Flags**: Click on any applicable warning signs
   - **Add Notes**: Optional additional observations

3. **Submit**:
   - Click "Complete Triage & Add to Queue"
   - Patient is automatically added to the waiting queue
   - Queue position is determined by triage level

### Viewing Triaged Patients

The **Dashboard Queue** displays:
- Queue number (position)
- Patient name and demographics
- **Triage Level** (color-coded badge)
- **Chief Complaint**
- Time added to queue
- Current status

### Queue Priorities

Patients are automatically sorted:
```
Level 1 patients → Level 2 patients → Level 3 patients → Level 4 patients → Level 5 patients
(Within each level, sorted by time added - oldest first)
```

## API Endpoints

### POST `/api/triage`

Performs triage on a patient and adds them to the queue.

**Request Body**:
```json
{
  "patientId": "string",
  "triageLevel": 1-5,
  "chiefComplaint": "string (required)",
  "vitalSigns": {
    "bloodPressureSystolic": number,
    "bloodPressureDiastolic": number,
    "heartRate": number,
    "respiratoryRate": number,
    "temperature": number,
    "oxygenSaturation": number,
    "painScore": number,
    "weight": number,
    "height": number
  },
  "triageNotes": "string (optional)",
  "redFlags": ["string array"]
}
```

**Response**:
```json
{
  "success": true
}
```

## Data Model

### Patient Model Extension

```typescript
interface Patient {
  // ... existing fields
  triage?: TriageData;
}
```

### TriageData

```typescript
interface TriageData {
  triageLevel: 1 | 2 | 3 | 4 | 5;
  chiefComplaint: string;
  vitalSigns: VitalSigns;
  triageNotes?: string;
  redFlags?: string[];
  triageBy?: string;
  triageAt?: Date | string;
  isTriaged: boolean;
}
```

### VitalSigns

```typescript
interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  painScore?: number;
  weight?: number;
  height?: number;
}
```

## Database Functions

### `triagePatient(patientId, triageData)`
Performs triage on a patient and adds them to the queue.

### `updateTriageData(patientId, triageData)`
Updates existing triage information for a patient.

### `getTriagedPatientsQueue()`
Returns today's queue sorted by triage priority.

## Files & Components

### Core Files
- `/lib/types.ts` - Type definitions for triage
- `/lib/models.ts` - Database functions for triage
- `/app/api/triage/route.ts` - API endpoint

### Components
- `/components/triage/triage-form.tsx` - Main triage form
- `/components/queue-table.tsx` - Updated to show triage info

### Pages
- `/app/(routes)/patients/[id]/triage/page.tsx` - Triage assessment page
- `/app/(routes)/dashboard/page.tsx` - Updated to use priority queue

## Best Practices

1. **Always Perform Triage**: Every patient should be triaged before entering the queue
2. **Reassess When Needed**: If patient condition changes, update triage level
3. **Document Red Flags**: Always select applicable warning signs for safety
4. **Record Vital Signs**: Complete vitals help physicians make faster decisions
5. **Be Accurate**: Triage level determines wait time and priority

## Safety Features

- **Medical Alerts**: Allergies and conditions displayed prominently
- **Red Flag Warning**: Alert shown if red flags selected with low priority
- **Color Coding**: Visual triage level indicators throughout system
- **Priority Sorting**: Critical patients automatically prioritized

## Future Enhancements

- [ ] Auto-calculate triage level based on vitals and red flags
- [ ] Triage timer/alerts for breach times
- [ ] Re-triage reminders for long waits
- [ ] Triage audit trail
- [ ] Statistics dashboard for triage levels
- [ ] Integration with hospital transfer protocols
- [ ] Pediatric-specific triage criteria
- [ ] Mobile triage interface

## Support

For questions or issues with the triage system, contact the development team or refer to the main project documentation.

