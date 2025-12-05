/**
 * Automatically link user to practitioner
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID!;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET!;

const email = 'dayatfactor@gmail.com';
const practitionerId = '0141f4e1-3807-4dc8-a496-e777d0e9214e'; // The one we just created

async function autoLink() {
  console.log('\n🤖 AUTO-LINKING USER TO PRACTITIONER...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });

  try {
    // Authenticate with admin credentials
    console.log('📡 Authenticating as admin...');
    await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
    console.log('✅ Authenticated!\n');

    // Get current profile to find project ID
    const adminProfile = await medplum.getProfile();
    const projectId = (adminProfile as any).meta?.project;
    console.log('📋 Project ID:', projectId);
    console.log('');

    // Search for ProjectMemberships with this email
    console.log('🔍 Finding user membership...');
    const memberships = await medplum.searchResources('ProjectMembership', {
      '_filter': `user.email eq "${email}"`,
    });

    if (memberships.length === 0) {
      console.log('❌ No membership found for this email');
      console.log('   The user might not exist in this project.\n');
      throw new Error('User membership not found');
    }

    const membership = memberships[0];
    console.log('✅ Found membership:', membership.id);
    console.log('   Current profile:', (membership as any).profile?.reference || 'None');
    console.log('');

    // Update the membership with the new practitioner
    console.log('🔗 Linking to Practitioner...');
    const updatedMembership = await medplum.updateResource({
      ...membership,
      profile: {
        reference: `Practitioner/${practitionerId}`,
        display: 'Hidayat Doctor',
      },
    });

    console.log('✅ Membership updated!');
    console.log('   New profile:', (updatedMembership as any).profile?.reference);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! USER IS NOW LINKED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ NOW TRY LOGGING IN:\n');
    console.log('   URL: http://localhost:3002/login');
    console.log(`   Email: ${email}`);
    console.log('   Password: matn0r007\n');

    console.log('   It should work now! 🚀\n');

  } catch (error: any) {
    console.error('\n❌ Failed:', error.message);
    
    if (error.outcome) {
      console.error('Outcome:', JSON.stringify(error.outcome, null, 2));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 MANUAL STEPS REQUIRED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Auto-linking failed due to permissions.');
    console.log('\nPlease do this manually:');
    console.log('1. Go to: http://localhost:3001');
    console.log('2. Admin → Project → Users');
    console.log('3. Click: dayatfactor@gmail.com');
    console.log('4. Select: Hidayat Doctor');
    console.log('5. Save\n');
  }
}

autoLink();








