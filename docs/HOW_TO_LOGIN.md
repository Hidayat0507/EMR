# How to Login to Your EMR System

**Authentication System:** Medplum FHIR Authentication  
**Login Page:** `/login`

---

## 🚀 Quick Start

### 1. **Access the Login Page**

```
http://localhost:3000/login
```

Or in production:
```
https://your-domain.com/login
```

### 2. **Enter Your Credentials**

- **Email:** Your Medplum user email
- **Password:** Your Medplum password

### 3. **Click "Sign in"**

You'll be redirected to `/dashboard` on successful login.

---

## 👤 Getting Your First User Account

### Option 1: Create User via Medplum Admin Console

**Step 1:** Access Medplum admin console
```
http://localhost:8103    (or your Medplum server URL)
```

**Step 2:** Login with your admin credentials

**Step 3:** Navigate to **Users** or **Practitioners**

**Step 4:** Click **"Create New User"**

**Step 5:** Fill in:
- Email address
- Password
- Name
- Role (Practitioner, Admin, etc.)

**Step 6:** Save

**Step 7:** Use these credentials in your EMR login page

---

### Option 2: Create User via Medplum CLI

```bash
# Login to Medplum CLI
npx medplum login

# Create a new user
npx medplum create-user \
  --email doctor@clinic.com \
  --password SecurePassword123! \
  --first-name John \
  --last-name Doe \
  --role Practitioner
```

---

### Option 3: Create User Programmatically

Create a script to add users:

```typescript
// scripts/create-user.ts
import { MedplumClient } from '@medplum/core';

const medplum = new MedplumClient({
  baseUrl: 'http://localhost:8103',
  clientId: process.env.MEDPLUM_CLIENT_ID!,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET!,
});

await medplum.startClientLogin(
  process.env.MEDPLUM_CLIENT_ID!,
  process.env.MEDPLUM_CLIENT_SECRET!
);

// Create a Practitioner
const practitioner = await medplum.createResource({
  resourceType: 'Practitioner',
  name: [{
    family: 'Smith',
    given: ['John'],
    text: 'Dr. John Smith'
  }],
  telecom: [{
    system: 'email',
    value: 'doctor@clinic.com'
  }]
});

console.log('✅ User created:', practitioner.id);
console.log('Email: doctor@clinic.com');
console.log('Use Medplum admin to set password');
```

---

## 🔐 Authentication Flow

### What Happens When You Login:

```
1. Enter email + password
   ↓
2. App calls Medplum.startLogin()
   ↓
3. Medplum validates credentials
   ↓
4. Medplum returns access token
   ↓
5. App stores token in:
   - localStorage (browser)
   - Cookie (server-side)
   ↓
6. App fetches user profile
   ↓
7. Redirect to /dashboard
```

### Where Authentication is Stored:

**Client-side:**
- `localStorage.getItem('medplum-access-token')`
- Used for browser-side API calls

**Server-side:**
- Cookie: `medplum-session`
- Used for server components and API routes

---

## 🛠️ Current Setup

### Environment Variables Required:

```bash
# .env.local

# Medplum Server URL
MEDPLUM_BASE_URL=http://localhost:8103

# For server-to-server operations
MEDPLUM_CLIENT_ID=your_client_id
MEDPLUM_CLIENT_SECRET=your_client_secret
```

### Files Involved:

```
app/(routes)/login/page.tsx       → Login UI
lib/auth-medplum.tsx              → Medplum authentication
lib/server/medplum-auth.ts        → Server-side auth
app/api/auth/medplum-session/     → Session management
middleware.ts                      → Auth protection
```

---

## 🔧 Creating Your First Admin User

If you don't have ANY users yet:

### 1. **Via Medplum Docker Setup**

If using Docker, Medplum creates a default admin:

```bash
# Default credentials (change these!)
Email: admin@example.com
Password: admin
```

**⚠️ IMPORTANT:** Change these immediately in production!

---

### 2. **Via Medplum Server Direct**

**Step 1:** Access Medplum server
```
http://localhost:8103
```

**Step 2:** Click "Sign Up" (if enabled)

**Step 3:** Create admin account

**Step 4:** Login to Medplum admin panel

**Step 5:** Create additional users from there

---

### 3. **Via Environment Variables** (Development)

For development, you can use basic auth:

```bash
# .env.local
MEDPLUM_EMAIL=admin@example.com
MEDPLUM_PASSWORD=admin
```

This allows server-side operations, but you still need users for the UI.

---

## 🚨 Troubleshooting

### Problem: "Login failed" error

**Check:**
1. Is Medplum server running?
   ```bash
   curl http://localhost:8103/healthcheck
   ```

2. Are credentials correct?
   - Try logging into Medplum admin console directly

3. Check browser console for detailed errors

4. Verify environment variables:
   ```bash
   echo $MEDPLUM_BASE_URL
   ```

---

### Problem: "No access token found"

**Solution:**
1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Try logging in again

3. Check if cookies are enabled

---

### Problem: Can't access Medplum admin console

**Check:**
1. Is Medplum server running?
   ```bash
   docker ps | grep medplum
   ```

2. Is port 8103 accessible?
   ```bash
   lsof -i :8103
   ```

3. Check Medplum logs:
   ```bash
   docker logs medplum-server
   ```

---

### Problem: "User not found"

**Solution:**
1. Create user in Medplum admin console first
2. Make sure user type is `Practitioner` or `Patient`
3. Verify user has login permissions

---

## 📋 Step-by-Step: First Time Setup

### Complete Setup from Scratch:

**1. Start Medplum Server**
```bash
# If using Docker
docker-compose up -d medplum

# Or if running locally
npm run medplum:start
```

**2. Access Medplum Admin**
```
http://localhost:8103
```

**3. Create Your Admin User**
- Click "Sign Up" (if available)
- Or use default: `admin@example.com` / `admin`

**4. Create a Practitioner**
- Go to **Practitioners** section
- Click **"Create New"**
- Fill in:
  ```
  Name: Dr. John Smith
  Email: doctor@clinic.com
  ```
- Save

**5. Set Password**
- Go to **Users** section
- Find the user
- Set password: `YourSecurePassword123!`

**6. Test Login in Your EMR**
```
http://localhost:3000/login

Email: doctor@clinic.com
Password: YourSecurePassword123!
```

**7. Success!** 🎉
- You should be redirected to `/dashboard`

---

## 🔑 Password Reset

### For Users:

1. Click **"Forgot password?"** on login page
2. Contact your administrator
3. Admin resets password in Medplum console

### For Admins:

1. Login to Medplum admin console
2. Navigate to **Users**
3. Find the user
4. Click **"Reset Password"**
5. Set new password or send reset email

---

## 🛡️ Security Best Practices

### 1. **Strong Passwords**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Use password manager

### 2. **Environment Variables**
```bash
# NEVER commit these!
MEDPLUM_CLIENT_ID=xxx
MEDPLUM_CLIENT_SECRET=xxx
```

### 3. **Change Default Credentials**
```bash
# If using default admin@example.com, change it!
```

### 4. **Use HTTPS in Production**
```bash
MEDPLUM_BASE_URL=https://medplum.your-domain.com
```

### 5. **Rotate Credentials Regularly**
- Change passwords every 90 days
- Rotate client secrets annually

---

## 📊 User Roles

Your system supports different user types:

| Role | Access |
|------|--------|
| **Practitioner** | Full clinical access |
| **Admin** | System administration |
| **Patient** | Patient portal (if enabled) |
| **Nurse** | Clinical assistant access |

Set roles in Medplum admin console under user permissions.

---

## 🚀 Quick Commands

### Check if Medplum is Running:
```bash
curl http://localhost:8103/healthcheck
```

### Start Development Server:
```bash
bun run dev
```

### Access Login Page:
```bash
open http://localhost:3000/login
```

### Check Auth Status (in browser console):
```javascript
localStorage.getItem('medplum-access-token')
```

---

## 📖 Related Documentation

- [Medplum Authentication Docs](https://www.medplum.com/docs/auth)
- [FHIR Practitioner Resource](https://hl7.org/fhir/R4/practitioner.html)
- Your Medplum admin: `http://localhost:8103`

---

## 💡 Quick Test

Want to test authentication quickly?

**1. Start servers:**
```bash
# Terminal 1: Medplum
docker-compose up medplum

# Terminal 2: Your app
bun run dev
```

**2. Open browser:**
```
http://localhost:3000/login
```

**3. Try default credentials:**
```
Email: admin@example.com
Password: admin
```

**4. If works → Change password!**  
**If doesn't → Create user in Medplum admin console**

---

## 🆘 Still Can't Login?

1. **Check Medplum server logs**
2. **Verify environment variables**
3. **Try Medplum admin console directly**
4. **Check browser console for errors**
5. **Clear all browser data and try again**

If all else fails, check:
- `docs/MEDPLUM_FEATURES_IN_USE.md`
- Medplum community: https://github.com/medplum/medplum/discussions

---

**Need help?** Check your Medplum server logs or ask your administrator! 🚀








