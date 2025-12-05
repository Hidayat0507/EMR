/**
 * API endpoint to get imaging studies
 * 
 * GET /api/imaging/results?patientId=xxx
 * GET /api/imaging/results?encounterId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPatientImagingStudies, getEncounterImagingStudies } from '@/lib/fhir/imaging-service';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('encounterId');

    if (!patientId && !encounterId) {
      return NextResponse.json(
        { error: 'Either patientId or encounterId is required' },
        { status: 400 }
      );
    }

    let studies;
    if (encounterId) {
      studies = await getEncounterImagingStudies(encounterId);
    } else if (patientId) {
      studies = await getPatientImagingStudies(patientId);
    }

    return NextResponse.json({
      success: true,
      studies,
    });

  } catch (error: any) {
    console.error('Error getting imaging studies:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get imaging studies',
        details: error.message 
      },
      { status: 500 }
    );
  }
}








