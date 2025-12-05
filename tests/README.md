# Tests & Development Scripts

This directory contains test scripts, seed data generators, and development utilities.

## Directory Structure

```
tests/
├── seeds/          # Database seeding scripts
└── dev-scripts/    # Development and testing utilities
```

## Seeds

Located in `tests/seeds/`, these scripts help populate your database with test data:

- **`seed.ts`** - Main seeding script for the database
- **`seed-procedures.ts`** - Seeds medical procedures data
- **`seed-one-patient.mjs`** - Creates a single test patient

### Usage

```bash
# Run the main seed script
bun run tests/seeds/seed.ts

# Seed procedures
bun run tests/seeds/seed-procedures.ts

# Create one test patient
bun run tests/seeds/seed-one-patient.mjs
```

## Development Scripts

Located in `tests/dev-scripts/`, these are utilities for development and testing:

- **`create-medplum-first-patient.sh`** - Creates first patient in Medplum for testing
- **`quick-medplum-test.ts`** - Quick test script for Medplum integration

### Usage

```bash
# Create first Medplum patient
bash tests/dev-scripts/create-medplum-first-patient.sh

# Run quick Medplum test
bun run tests/dev-scripts/quick-medplum-test.ts
```

## Notes

- These scripts are for **development and testing only**
- Do not run seed scripts in production
- Make sure environment variables are properly configured before running scripts
- Some scripts may require Medplum credentials to be set up

## Related

- Production setup scripts are in `/scripts/`
- API test routes are in `/app/(routes)/api/dev/`

