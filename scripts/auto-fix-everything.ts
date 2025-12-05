/**
 * Auto-fix: Update the user's profile link
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID!;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET!;

const email = 'dayatfactor@gmail.com';
const practitionerId = '0141f4e1-3807-4dc8-a496-e777d0e9214e';

async function autoFix() {
  console.log('\n🤖 AUTO-FIXING USER PROFILE...\n');

  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });

  try {
    // Authenticate
    console.log('📡 Authenticating...');
    await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
    console.log('✅ Authenticated!\n');

    // Get project info
    const profile = await medplum.getProfile();
    const projectId = (profile as any).meta?.project;
    console.log('📋 Project:', projectId);

    // Try direct HTTP request to update membership
    console.log('\n🔧 Attempting to update membership via direct API...');
    
    const accessToken = medplum.getAccessToken();
    
    // Search for the membership
    const searchUrl = `${MEDPLUM_BASE_URL}/fhir/R4/ProjectMembership?_count=100`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/fhir+json',
      },
    });
    
    const searchBundle = await searchResponse.json();
    
    // Find the membership for our user
    let targetMembership = null;
    if (searchBundle.entry) {
      for (const entry of searchBundle.entry) {
        const membership = entry.resource;
        const userRef = membership.user?.reference;
        
        // Try to get the user to check email
        if (userRef) {
          const userId = userRef.split('/')[1];
          try {
            const userResponse = await fetch(`${MEDPLUM_BASE_URL}/fhir/R4/User/${userId}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
            const user = await userResponse.json();
            
            if (user.email === email) {
              targetMembership = membership;
              console.log('✅ Found target membership:', membership.id);
              break;
            }
          } catch (err) {
            // Skip
          }
        }
      }
    }

    if (!targetMembership) {
      console.log('❌ Could not find membership for', email);
      throw new Error('Membership not found');
    }

    // Update the membership
    console.log('\n🔗 Updating profile link...');
    
    targetMembership.profile = {
      reference: `Practitioner/${practitionerId}`,
      display: 'Hidayat Doctor',
    };

    const updateResponse = await fetch(
      `${MEDPLUM_BASE_URL}/fhir/R4/ProjectMembership/${targetMembership.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/fhir+json',
        },
        body: JSON.stringify(targetMembership),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.log('❌ Update failed:', error);
      throw new Error('Update failed');
    }

    const updated = await updateResponse.json();
    console.log('✅ Membership updated!');
    console.log('   Profile:', updated.profile?.reference);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! PROFILE LINKED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ NOW TRY LOGGING IN:\n');
    console.log('   http://localhost:3002/login');
    console.log(`   Email: ${email}`);
    console.log('   Password: matn0r007\n');
    console.log('   IT SHOULD WORK NOW! 🚀\n');

  } catch (error: any) {
    console.error('\n❌ Auto-fix failed:', error.message);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('😞 I CAN\'T DO IT AUTOMATICALLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Medplum security is blocking me.');
    console.log('\nYOU MUST DO THESE 5 CLICKS:\n');
    console.log('http://localhost:3001/admin/project');
    console.log('\n1. Click "Users" tab');
    console.log('2. Click "dayatfactor@gmail.com"');
    console.log('3. Click profile field');
    console.log('4. Select "Hidayat Doctor"');
    console.log('5. Click "Save"\n');
    console.log('THAT\'S IT! Takes 30 seconds!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

autoFix();








