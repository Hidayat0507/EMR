/**
 * Create Practitioner and link to user
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID!;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET!;

const email = 'dayatfactor@gmail.com';
const firstName = 'Hidayat';
const lastName = 'Doctor';

async function createAndLink() {
  console.log('\n🔧 Creating Practitioner and Linking to User...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });

  try {
    // Authenticate
    console.log('📡 Authenticating...');
    await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
    console.log('✅ Authenticated!\n');

    // Create Practitioner
    console.log('👨‍⚕️ Creating Practitioner...');
    const practitioner = await medplum.createResource({
      resourceType: 'Practitioner',
      name: [{
        use: 'official',
        family: lastName,
        given: [firstName],
        text: `${firstName} ${lastName}`,
      }],
      telecom: [{
        system: 'email',
        value: email,
        use: 'work',
      }],
      active: true,
    });

    console.log('✅ Practitioner created!');
    console.log('   ID:', practitioner.id);
    console.log('   Name:', `${firstName} ${lastName}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 NEXT STEPS:\n');
    console.log('1. Go back to Medplum App: http://localhost:3001');
    console.log('2. Go to: Admin → Project → Users');
    console.log('3. Click on your user (dayatfactor@gmail.com)');
    console.log('4. In the profile field, it should now show:');
    console.log(`   ${firstName} ${lastName}`);
    console.log('5. Select it and click "Save"');
    console.log('6. Then try logging in: http://localhost:3002/login\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message?.includes('Forbidden') || error.outcome?.id === 'forbidden') {
      console.log('\n💡 ALTERNATIVE - CREATE VIA MEDPLUM UI:\n');
      console.log('1. Go to Medplum App: http://localhost:3001');
      console.log('2. Go to: Search → Practitioner');
      console.log('3. Click "New" or "Create New"');
      console.log('4. Fill in:');
      console.log(`   Name: ${firstName} ${lastName}`);
      console.log(`   Email: ${email}`);
      console.log('5. Save');
      console.log('6. Then go to Users and link to this practitioner\n');
    } else {
      console.error('\nFull error:', error);
    }
  }
}

createAndLink();








