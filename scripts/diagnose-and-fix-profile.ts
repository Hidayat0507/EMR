/**
 * Diagnose and fix the profile link issue
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID!;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET!;

const email = 'dayatfactor@gmail.com';
const password = 'matn0r007';
const practitionerId = 'f26cfc12-65c1-45f4-8389-ed35cc9f2209';

async function diagnoseAndFix() {
  console.log('\n🔍 DIAGNOSING PROFILE ISSUE...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const medplum = new MedplumClient({ 
    baseUrl: MEDPLUM_BASE_URL,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      getObject: () => undefined,
      setObject: () => {},
    } as any,
  });

  try {
    // Step 1: Try to login as the user
    console.log('🔐 STEP 1: Testing user login...');
    console.log(`   Email: ${email}`);
    
    try {
      await medplum.startLogin({ email, password });
      console.log('✅ Login successful!\n');
      
      // Try to get profile
      console.log('🔐 STEP 2: Getting profile...');
      const profile = await medplum.getProfile();
      
      if (profile) {
        console.log('✅ Profile found!');
        console.log('   Type:', profile.resourceType);
        console.log('   ID:', profile.id);
        console.log('   Display:', (profile as any).name?.[0]?.text || 'N/A');
        console.log('\n🎉 PROFILE IS WORKING!');
        console.log('   Try logging in to EMR again - it should work!\n');
        return;
      } else {
        console.log('❌ Profile is NULL/undefined\n');
      }
    } catch (loginError: any) {
      console.log('❌ Login failed:', loginError.message, '\n');
    }

    // Step 2: Use client credentials to investigate
    console.log('🔐 STEP 3: Checking with admin credentials...');
    await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
    console.log('✅ Admin authenticated\n');

    // Check if Practitioner exists
    console.log('🔐 STEP 4: Verifying Practitioner exists...');
    try {
      const practitioner = await medplum.readResource('Practitioner', practitionerId);
      console.log('✅ Practitioner exists!');
      console.log('   ID:', practitioner.id);
      console.log('   Name:', (practitioner as any).name?.[0]?.text || 'N/A');
      console.log('');
    } catch (err) {
      console.log('❌ Practitioner NOT found!');
      console.log('   The Practitioner ID might be wrong.\n');
      
      // Search for practitioners
      console.log('🔍 Searching for practitioners...');
      const practitioners = await medplum.searchResources('Practitioner', { name: 'hidayat' });
      if (practitioners.length > 0) {
        console.log(`Found ${practitioners.length} practitioner(s):\n`);
        practitioners.forEach(p => {
          console.log(`   - ${(p as any).name?.[0]?.text || 'N/A'} (ID: ${p.id})`);
        });
        console.log('');
      }
    }

    // Check ProjectMembership
    console.log('🔐 STEP 5: Checking ProjectMembership...');
    const memberships = await medplum.searchResources('ProjectMembership', {
      profile: `Practitioner/${practitionerId}`,
    });

    if (memberships.length === 0) {
      console.log('❌ No ProjectMembership found linking user to Practitioner!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔧 FIX REQUIRED:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('In Medplum App (http://localhost:3001):');
      console.log('1. Go to Admin → Project → Users');
      console.log('2. Click on your user');
      console.log('3. Click the profile name "hidayat shariff"');
      console.log('4. Check the ID in the URL or page');
      console.log('5. Come back and tell me the actual Practitioner ID\n');
      console.log('OR\n');
      console.log('1. Delete the user from Medplum');
      console.log('2. Re-create it with the correct Practitioner link');
      console.log(`3. Make sure to link to: Practitioner/${practitionerId}\n`);
    } else {
      console.log(`✅ Found ${memberships.length} membership(s):`);
      memberships.forEach(m => {
        console.log('   Membership ID:', m.id);
        console.log('   User:', (m as any).user?.reference || 'N/A');
        console.log('   Profile:', (m as any).profile?.reference || 'N/A');
        console.log('   Project:', (m as any).project?.reference || 'N/A');
        console.log('');
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤔 MEMBERSHIP EXISTS BUT LOGIN FAILS?');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Possible issues:');
      console.log('1. The profile reference format might be wrong');
      console.log('2. Access policy might be blocking it');
      console.log('3. The user might be in a different project\n');
      console.log('Try this:');
      console.log('1. In Medplum App, click on "hidayat shariff" profile');
      console.log('2. Check what the actual Practitioner ID is');
      console.log('3. It should match:', practitionerId);
      console.log('4. If different, update the profile link\n');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

diagnoseAndFix();








