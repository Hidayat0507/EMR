
import { Buffer } from 'buffer';

const svcRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!svcRaw) {
    console.log('❌ FIREBASE_SERVICE_ACCOUNT is missing');
    process.exit(1);
}

try {
    console.log('Raw length:', svcRaw.length);

    const json = svcRaw.trim().startsWith('{') ? svcRaw : Buffer.from(svcRaw, 'base64').toString('utf8');
    console.log('Decoded JSON length:', json.length);

    const parsed = JSON.parse(json);
    console.log('Parsed JSON keys:', Object.keys(parsed));

    if (parsed.private_key) {
        console.log('Private Key found.');
        console.log('Length:', parsed.private_key.length);
        console.log('First 50 chars:', parsed.private_key.substring(0, 50));

        const processedKey = parsed.private_key.replace(/\\n/g, '\n');
        console.log('Processed Key first 50 chars:', processedKey.substring(0, 50));

        // Check for common issues
        if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
            console.log('❌ Missing BEGIN PRIVATE KEY header');
        }
        if (!processedKey.includes('-----END PRIVATE KEY-----')) {
            console.log('❌ Missing END PRIVATE KEY footer');
        }
    } else {
        console.log('❌ private_key is missing in JSON');
    }

} catch (e: any) {
    console.log('❌ Error parsing key:', e.message);
}
