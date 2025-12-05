/**
 * Check if user can login and diagnose issues
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const email = 'dayatfactor@gmail.com';
const password = 'matn0r007';

async function checkLogin() {
  console.log('\n🔍 Diagnosing Login Issue...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', email);
  console.log('🌐 Medplum URL:', MEDPLUM_BASE_URL);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const medplum = new MedplumClient({ baseUrl: MEDPLUM_BASE_URL });

  try {
    // Try to login
    console.log('🔐 Attempting login...');
    await medplum.startLogin(email, password);
    
    // If we get here, login worked!
    console.log('✅ LOGIN SUCCESSFUL!\n');
    
    // Get profile
    const profile = await medplum.getProfile();
    console.log('👤 Profile loaded:');
    console.log('   Type:', profile.resourceType);
    console.log('   ID:', profile.id);
    console.log('   Display:', (profile as any).name?.[0]?.text || email);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 YOUR CREDENTIALS ARE CORRECT!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ You should be able to login at:');
    console.log('   http://localhost:3000/login\n');
    
    console.log('📧 Use these credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);
    
  } catch (error: any) {
    console.log('❌ LOGIN FAILED!\n');
    console.log('Error:', error.message);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DIAGNOSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (error.message.includes('Invalid') || error.message.includes('credentials')) {
      console.log('❌ WRONG PASSWORD or USER NOT SET UP\n');
      console.log('💡 SOLUTIONS:\n');
      console.log('Option 1: Reset password in Medplum admin');
      console.log('   1. Go to: http://localhost:8103');
      console.log('   2. Login as admin');
      console.log('   3. Go to: Admin → Users');
      console.log(`   4. Find user: ${email}`);
      console.log('   5. Click "Set Password"');
      console.log(`   6. Set password: ${password}\n`);
      
      console.log('Option 2: User account may not exist');
      console.log('   1. Go to: http://localhost:8103');
      console.log('   2. Login as admin');
      console.log('   3. Go to: Admin → Users');
      console.log('   4. Check if user exists');
      console.log('   5. If not, create new User account');
      console.log(`   6. Email: ${email}`);
      console.log(`   7. Password: ${password}`);
      console.log('   8. Link to Practitioner: f26cfc12-65c1-45f4-8389-ed35cc9f2209\n');
      
    } else if (error.message.includes('not found')) {
      console.log('❌ USER ACCOUNT NOT FOUND\n');
      console.log('The Practitioner exists, but no User account!\n');
      console.log('💡 CREATE USER ACCOUNT:\n');
      console.log('1. Go to: http://localhost:8103');
      console.log('2. Login as admin');
      console.log('3. Go to: Admin → Users → Create New');
      console.log(`4. Email: ${email}`);
      console.log(`5. Password: ${password}`);
      console.log('6. Project: Select your project');
      console.log('7. Profile: Link to Practitioner f26cfc12-65c1-45f4-8389-ed35cc9f2209');
      console.log('8. Save\n');
      
    } else {
      console.log('❌ UNKNOWN ERROR\n');
      console.log('Full error details:', error);
      console.log('\n💡 TRY:\n');
      console.log('1. Check Medplum server logs');
      console.log('2. Verify Medplum is accessible: http://localhost:8103');
      console.log('3. Try creating user manually in Medplum admin\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

checkLogin();








