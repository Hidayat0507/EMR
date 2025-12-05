# 📜 Scripts Directory

Organized scripts for setup, migration, development, and testing.

---

## 📁 Directory Structure

```
scripts/
├── setup/          # Initial setup scripts
├── migration/      # Data migration scripts  
├── dev/            # Development utilities
├── test/           # Testing scripts
└── README.md       # This file
```

---

## 🚀 Setup Scripts (`scripts/setup/`)

### `setup-access-policies.ts`
Creates Medplum Access Policies (RBAC).

```bash
bun run scripts/setup/setup-access-policies.ts
```

**What it does:**
- Creates 5 access policies (Admin, Doctor, Nurse, Billing, Patient)
- Outputs policy IDs to add to `.env.local`

**When to run:**
- First time setup
- After resetting Medplum database
- When updating permissions

---

### `quick-test-medplum.ts`
Quick diagnostic test for Medplum connection.

```bash
bun run scripts/setup/quick-test-medplum.ts
```

**What it checks:**
- Medplum server connection
- Admin credentials
- Access policies
- Practitioners and users

**When to run:**
- Troubleshooting connection issues
- Verifying setup
- After Medplum updates

---

### Shell Scripts

**`create-medplum-client-app.sh`**
- Creates OAuth client application in Medplum

**`create-medplum-client-credentials.sh`**
- Generates client credentials for backend

**`setup-medplum-user.sh`**
- Helper to create Medplum users

---

## 🔄 Migration Scripts (`scripts/migration/`)

**Coming soon:**
- `migrate-firebase-users.ts` - Migrate Firebase Auth users to Medplum
- `migrate-patients.ts` - Migrate patient data
- `migrate-consultations.ts` - Migrate consultation records

---

## 🛠️ Development Scripts (`scripts/dev/`)

### `seed-one-patient.mjs`
Seeds a single test patient for development.

```bash
bun run scripts/dev/seed-one-patient.mjs
```

**Coming soon:**
- `create-practitioner.ts` - Create test practitioner
- `seed-test-data.ts` - Seed comprehensive test data
- `reset-dev-db.ts` - Reset development database

---

## 🧪 Test Scripts (`scripts/test/`)

### `test-lab-imaging-integration.ts`
Tests lab and imaging integration.

```bash
bun run scripts/test/test-lab-imaging-integration.ts
```

**Coming soon:**
- `test-auth.ts` - Test authentication flow
- `test-permissions.ts` - Test RBAC permissions
- `test-fhir-export.ts` - Test FHIR export functionality

---

## 📝 Usage Guidelines

### Running Scripts

```bash
# TypeScript scripts
bun run scripts/[category]/[script-name].ts

# JavaScript/MJS scripts
bun run scripts/[category]/[script-name].mjs

# Shell scripts
bash scripts/[category]/[script-name].sh
# or make executable:
chmod +x scripts/[category]/[script-name].sh
./scripts/[category]/[script-name].sh
```

### Environment Variables

Most scripts require environment variables in `.env.local`:

```bash
# Medplum Configuration
MEDPLUM_BASE_URL=http://localhost:8103
MEDPLUM_CLIENT_ID=your-client-id
MEDPLUM_CLIENT_SECRET=your-client-secret
```

### Script Order for Initial Setup

1. **Start Medplum** (see [docs/auth/SETUP.md](../docs/auth/SETUP.md))
2. **Test connection**: `bun run scripts/setup/quick-test-medplum.ts`
3. **Create policies**: `bun run scripts/setup/setup-access-policies.ts`
4. **Add policy IDs to `.env.local`**
5. **Create users in Medplum UI** (http://localhost:3001)
6. **Seed test data** (optional): `bun run scripts/dev/seed-one-patient.mjs`

---

## 🆘 Need Help?

- **Authentication**: See [docs/auth/README.md](../docs/auth/README.md)
- **Troubleshooting**: See [docs/auth/TROUBLESHOOTING.md](../docs/auth/TROUBLESHOOTING.md)
- **Project Rules**: See [docs/rules/rules.md](../docs/rules/rules.md)

---

## 📋 Script Template

When creating new scripts, use this template:

```typescript
#!/usr/bin/env bun
/**
 * [Script Name] - [Brief Description]
 * 
 * Usage: bun run scripts/[category]/[script-name].ts
 * 
 * Requirements:
 * - MEDPLUM_BASE_URL
 * - MEDPLUM_CLIENT_ID
 * - MEDPLUM_CLIENT_SECRET
 */

import { MedplumClient } from '@medplum/core';

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL || 'http://localhost:8103';
const MEDPLUM_CLIENT_ID = process.env.MEDPLUM_CLIENT_ID;
const MEDPLUM_CLIENT_SECRET = process.env.MEDPLUM_CLIENT_SECRET;

if (!MEDPLUM_CLIENT_ID || !MEDPLUM_CLIENT_SECRET) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function main() {
  console.log('🚀 Starting [Script Name]...\n');
  
  const medplum = new MedplumClient({
    baseUrl: MEDPLUM_BASE_URL,
    clientId: MEDPLUM_CLIENT_ID,
    clientSecret: MEDPLUM_CLIENT_SECRET,
  });
  
  await medplum.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
  
  // Your script logic here
  
  console.log('\n✅ [Script Name] complete!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
```

---

## 📦 Adding New Scripts

1. **Choose appropriate category** (setup, migration, dev, test)
2. **Follow naming convention**: `kebab-case-name.ts`
3. **Add shebang**: `#!/usr/bin/env bun`
4. **Document in this README**
5. **Add usage example**
6. **Include error handling**
7. **Log progress clearly** (use emojis for visibility)

---

**Last updated:** December 2024
