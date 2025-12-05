/**
 * Referral API - FHIR via Medplum (ServiceRequest)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  saveReferralToMedplum,
  getReferralFromMedplum,
  getPatientReferralsFromMedplum,
} from '@/lib/fhir/referral-service';

/**
 * POST - Create a new referral
 */
export async function POST(request: NextRequest) {
  try {
    const referralData = await request.json();

    // Validate required fields
    if (!referralData.patientId || !referralData.specialty || !referralData.facility || !referralData.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, specialty, facility, reason' },
        { status: 400 }
      );
    }

    const referralId = await saveReferralToMedplum(referralData);

    return NextResponse.json({
      success: true,
      referralId,
      message: 'Referral saved to FHIR successfully',
    });
  } catch (error: any) {
    console.error('❌ Failed to save referral:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save referral',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get referrals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get('id');
    const patientId = searchParams.get('patientId');

    // Get specific referral
    if (referralId) {
      const referral = await getReferralFromMedplum(referralId);
      if (!referral) {
        return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, referral });
    }

    // Get patient referrals
    if (patientId) {
      const referrals = await getPatientReferralsFromMedplum(patientId);
      return NextResponse.json({
        success: true,
        count: referrals.length,
        referrals,
      });
    }

    return NextResponse.json({ error: 'Missing query parameter: id or patientId' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Failed to get referrals:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get referrals',
      },
      { status: 500 }
    );
  }
}








