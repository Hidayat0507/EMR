# EMR Project Structure

This document provides a quick overview of the project organization.

## 📁 Directory Structure

```
EMR/
├── 📄 README.md                    # Main project documentation
├── 📄 CHANGELOG.md                 # Version history
├── 📄 PROJECT_STRUCTURE.md         # This file
│
├── 📁 docs/                        # All documentation
│   ├── 📄 README.md                # Documentation index
│   ├── 📁 setup/                   # Setup guides
│   │   ├── MEDPLUM_AUTH_SETUP.md
│   │   ├── QUICK_START_MEDPLUM_AUTH.md
│   │   └── START_HERE_MEDPLUM_AUTH.md
│   ├── 📁 features/                # Feature documentation
│   │   ├── LABS_IMAGING_INTEGRATION.md
│   │   └── TRIAGE_SYSTEM.md
│   └── 📁 rules/                   # Project rules & standards
│       ├── rules.md
│       └── setup.md
│
├── 📁 scripts/                     # Production setup scripts
│   ├── 📄 README.md
│   ├── create-medplum-client-app.sh
│   ├── create-medplum-client-credentials.sh
│   ├── setup-medplum-access-policies.ts
│   └── setup-medplum-user.sh
│
├── 📁 tests/                       # Development & testing
│   ├── 📄 README.md
│   ├── 📁 seeds/                   # Database seeding
│   │   ├── seed.ts
│   │   ├── seed-procedures.ts
│   │   └── seed-one-patient.mjs
│   └── 📁 dev-scripts/             # Development utilities
│       ├── create-medplum-first-patient.sh
│       └── quick-medplum-test.ts
│
├── 📁 app/                         # Next.js app directory
│   ├── 📁 (routes)/                # Page routes
│   ├── 📁 api/                     # API routes
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── 📁 components/                  # React components
│   ├── 📁 ui/                      # UI components
│   ├── 📁 patients/
│   ├── 📁 billing/
│   └── ...
│
├── 📁 lib/                         # Utilities & business logic
│   ├── 📁 fhir/                    # FHIR integration
│   ├── 📁 models/                  # Data models
│   ├── 📁 server/                  # Server utilities
│   └── ...
│
└── 📁 modules/                     # Feature modules
    └── appointments/
```

## 🗂️ Documentation Organization

### Root Level (Keep Minimal)
- ✅ `README.md` - Main project overview
- ✅ `CHANGELOG.md` - Version history
- ✅ `PROJECT_STRUCTURE.md` - This file

### Documentation (`/docs/`)
- **`/docs/setup/`** - Setup and configuration guides
- **`/docs/features/`** - Feature-specific documentation
- **`/docs/rules/`** - Project standards and conventions
- **`/docs/README.md`** - Documentation index

### Scripts (`/scripts/`)
Production-ready setup scripts only:
- Medplum client setup
- Access policies configuration
- User management
- See `/scripts/README.md` for details

### Tests (`/tests/`)
Development and testing utilities:
- **`/tests/seeds/`** - Database seeding scripts
- **`/tests/dev-scripts/`** - Development utilities
- See `/tests/README.md` for details

## 🚀 Quick Start Commands

### Development
```bash
# Start development server
bun run dev

# Seed database
bun run seed
bun run seed:procedures
bun run seed:patient

# Run linting
bun run lint
```

### Production Setup
```bash
# See scripts/README.md for Medplum setup
bash scripts/create-medplum-client-app.sh
bash scripts/create-medplum-client-credentials.sh
# ... etc
```

### Testing
```bash
# Run dev scripts
bun run tests/dev-scripts/quick-medplum-test.ts

# Create test patient
bash tests/dev-scripts/create-medplum-first-patient.sh
```

## 📖 Where to Find Things

| What you need | Where to look |
|---------------|---------------|
| Getting started | `/README.md` |
| Setup instructions | `/docs/setup/` |
| Coding standards | `/docs/rules/rules.md` |
| Environment setup | `/docs/rules/setup.md` |
| Feature docs | `/docs/features/` |
| Production scripts | `/scripts/` + `/scripts/README.md` |
| Dev/test scripts | `/tests/` + `/tests/README.md` |
| Version history | `/CHANGELOG.md` |

## 🎯 File Naming Conventions

- **Documentation**: `UPPER_CASE.md` for important docs, `kebab-case.md` for regular docs
- **Code files**: `kebab-case.tsx` / `kebab-case.ts`
- **Components**: `PascalCase` for component names
- **Scripts**: `kebab-case.sh` / `kebab-case.ts`

## 🔍 Finding Files

```bash
# Find all documentation
find docs -name "*.md"

# Find all scripts
ls scripts/
ls tests/dev-scripts/
ls tests/seeds/

# Find specific component
find app/components -name "*patient*"
```

## 📝 Maintenance

- Keep root directory minimal (only README, CHANGELOG, PROJECT_STRUCTURE)
- Organize new docs into `/docs/setup/` or `/docs/features/`
- Put dev/test scripts in `/tests/`
- Keep only production setup in `/scripts/`
- Update this file when structure changes significantly

---

Last updated: December 2025








