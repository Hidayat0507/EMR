import { NextRequest, NextResponse } from 'next/server';
import { getTriagedPatientsQueue, addPatientToQueue, removePatientFromQueue, updateQueueStatus } from '@/lib/models';

export async function GET() {
  try {
    const patients = await getTriagedPatientsQueue();
    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    console.error('[queue] Failed to load triage queue:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load queue' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { patientId } = await req.json();
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
    }
    await addPatientToQueue(patientId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[queue] Failed to add:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to add to queue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { patientId } = await req.json();
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
    }
    await removePatientFromQueue(patientId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[queue] Failed to remove:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to remove from queue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { patientId, status } = await req.json();
    if (!patientId || typeof status === 'undefined') {
      return NextResponse.json({ success: false, error: 'patientId and status are required' }, { status: 400 });
    }
    await updateQueueStatus(patientId, status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[queue] Failed to update status:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update queue status' }, { status: 500 });
  }
}
