/**
 * Link User to Practitioner in Medplum
 * This creates the ProjectMembership that connects them
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID!;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET!;

const email = 'dayatfactor@gmail.com';
const practitionerId = 'f26cfc12-65c1-45f4-8389-ed35cc9f2209';

async function linkUserToPractitioner() {
  console.log('\n🔗 Linking User to Practitioner...\n');

  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });

  try {
    // Authenticate with client credentials
    console.log('📡 Authenticating...');
    await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
    console.log('✅ Authenticated!\n');

    // Find the user
    console.log('🔍 Finding user...');
    const users = await medplum.searchResources('User', { email });
    
    if (users.length === 0) {
      console.log('❌ User not found!');
      console.log('\n💡 The user might not exist in Medplum yet.');
      console.log('   Go to http://localhost:3001 and create the user account.\n');
      return;
    }

    const user = users[0];
    console.log('✅ Found user:', user.id);
    console.log('   Email:', (user as any).email);

    // Check if practitioner exists
    console.log('\n🔍 Checking practitioner...');
    const practitioner = await medplum.readResource('Practitioner', practitionerId);
    console.log('✅ Found practitioner:', practitioner.id);
    console.log('   Name:', (practitioner as any).name?.[0]?.text);

    // Check if ProjectMembership already exists
    console.log('\n🔍 Checking existing memberships...');
    const existingMemberships = await medplum.searchResources('ProjectMembership', {
      user: `User/${user.id}`,
      profile: `Practitioner/${practitionerId}`,
    });

    if (existingMemberships.length > 0) {
      console.log('✅ User is already linked to practitioner!');
      console.log('   Membership ID:', existingMemberships[0].id);
      console.log('\n💡 The link exists. The issue might be something else.');
      console.log('   Try logging in again at: http://localhost:3002/login\n');
      return;
    }

    // Get current project
    const profile = await medplum.getProfile();
    const projectId = (profile as any).meta?.project || (profile as any).project?.reference?.split('/')[1];
    
    console.log('\n🔗 Creating ProjectMembership...');
    console.log('   User:', user.id);
    console.log('   Practitioner:', practitionerId);
    console.log('   Project:', projectId || 'default');

    // Create ProjectMembership
    const membership = await medplum.createResource({
      resourceType: 'ProjectMembership',
      project: {
        reference: `Project/${projectId}`,
      },
      user: {
        reference: `User/${user.id}`,
      },
      profile: {
        reference: `Practitioner/${practitionerId}`,
      },
    });

    console.log('✅ ProjectMembership created!');
    console.log('   ID:', membership.id);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 USER SUCCESSFULLY LINKED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ NOW TRY LOGGING IN:\n');
    console.log('   URL: http://localhost:3002/login');
    console.log(`   Email: ${email}`);
    console.log('   Password: matn0r007\n');

    console.log('   It should work now! 🚀\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 ALTERNATIVE FIX:\n');
    console.log('1. Go to Medplum App: http://localhost:3001');
    console.log('2. Login with your credentials');
    console.log('3. Go to Admin → Project → Members');
    console.log('4. Find your user and edit it');
    console.log('5. Set "Profile" to the Practitioner:');
    console.log(`   Practitioner/${practitionerId}`);
    console.log('6. Save\n');
  }
}

linkUserToPractitioner();








