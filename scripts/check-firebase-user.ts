
import { adminAuth } from '../lib/firebase-admin';

const email = 'dayatfactor@gmail.com';

async function checkUser() {
    console.log(`Checking user: ${email}...`);
    try {
        const user = await adminAuth.getUserByEmail(email);
        console.log('✅ User found:');
        console.log(JSON.stringify(user.toJSON(), null, 2));
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log('❌ User NOT found in Firebase.');
        } else {
            console.error('❌ Error checking user:', error);
        }
    }
}

checkUser();
