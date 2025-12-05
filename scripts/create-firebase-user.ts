
import { adminAuth } from '../lib/firebase-admin';

const email = 'dayatfactor@gmail.com';
const password = 'matnor';

async function createUser() {
    console.log(`Creating user: ${email}...`);
    try {
        const user = await adminAuth.createUser({
            email,
            password,
            emailVerified: true,
        });
        console.log('✅ User created successfully:');
        console.log(JSON.stringify(user.toJSON(), null, 2));
    } catch (error: any) {
        console.error('❌ Error creating user:', error);
    }
}

createUser();
