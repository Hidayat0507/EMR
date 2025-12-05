/**
 * Create Medplum User via Direct API Call
 * This bypasses the admin console
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID!;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET!;

async function createUser() {
  console.log('\n🔐 Creating User via Medplum API...\n');

  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });

  // Login with client credentials
  console.log('📡 Authenticating...');
  await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
  console.log('✅ Authenticated!\n');

  const email = 'dayatfactor@gmail.com';
  const password = 'matn0r007';
  const practitionerId = 'f26cfc12-65c1-45f4-8389-ed35cc9f2209';

  try {
    // Get current project
    const profile = await medplum.getProfile();
    const projectId = (profile as any).meta?.project;
    
    console.log('📋 Project ID:', projectId || 'default');

    // Create ProjectMembership (this creates the User)
    console.log('👤 Creating user account...');
    
    const response = await fetch(`${MEDPLUM_BASE_URL}/admin/projects/${projectId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${medplum.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceType: 'Practitioner',
        firstName: 'Hidayat',
        lastName: 'Doctor',
        email: email,
        sendEmail: false,
        password: password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create user: ${error}`);
    }

    const result = await response.json();
    console.log('✅ User created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name: Hidayat Doctor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎉 YOU CAN NOW LOGIN!\n');
    console.log('Go to: http://localhost:3000/login');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 ALTERNATIVE: Use Medplum CLI\n');
    console.log('Run these commands:\n');
    console.log('# Install Medplum CLI');
    console.log('npm install -g @medplum/cli\n');
    console.log('# Login to Medplum');
    console.log('medplum login http://localhost:8103\n');
    console.log('# Create user');
    console.log('medplum create-resource <<EOF');
    console.log('{');
    console.log('  "resourceType": "ProjectMembership",');
    console.log(`  "profile": { "reference": "Practitioner/${practitionerId}" },`);
    console.log(`  "user": { "reference": "User/${email}" }`);
    console.log('}');
    console.log('EOF\n');
  }
}

createUser();








