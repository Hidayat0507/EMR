# 🏥 UCC EMR - Electronic Medical Records System

A modern, FHIR-compliant Electronic Medical Records system built with Next.js 15, TypeScript, and Medplum.

---

## ✨ Features

- 🔐 **Medplum Authentication** - Healthcare-native auth with FHIR profiles
- 👥 **Patient Management** - Complete patient records and history
- 📋 **Consultations** - SOAP notes, prescriptions, procedures
- 📅 **Appointments** - Scheduling and calendar management
- 💊 **Inventory** - Medication and supplies tracking
- 🧾 **Billing** - Automated billing and invoice generation
- 📊 **Analytics** - Dashboard and reports
- 🔬 **Lab & Imaging** - Order management and results
- 🚑 **Triage** - Patient triage workflow
- 📄 **Documents** - Medical certificates, referrals, reports
- 🔐 **Role-Based Access Control** - 5 roles with fine-grained permissions

---

## 🚀 Quick Start

### Prerequisites

- **Bun** (package manager)
- **Node.js** 18+
- **Medplum Server** (Docker or Cloud)
- **Firebase** (for Firestore)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd EMR

# Install dependencies
bun install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start Medplum (if using local)
cd ~/Documents/Projects/medplum
docker-compose -f docker-compose.full-stack.yml up -d

# Setup Medplum auth
cd /Users/hidayat/Documents/Projects/UCC/EMR
bun run scripts/setup/setup-access-policies.ts

# Start development server
bun run dev
```

Visit http://localhost:3000

---

## 📚 Documentation

### Getting Started

- **[Setup Guide](./docs/rules/setup.md)** - Development environment setup
- **[Project Rules](./docs/rules/rules.md)** - Coding standards & best practices
- **[Authentication](./docs/auth/QUICK_START.md)** - Auth setup (5 minutes)

### For Developers

- **[Developer Guide](./docs/auth/DEVELOPER_GUIDE.md)** - Code examples & patterns
- **[Scripts](./scripts/README.md)** - Available scripts & tools
- **[Troubleshooting](./docs/auth/TROUBLESHOOTING.md)** - Common issues

### Features

- **[Labs & Imaging](./docs/features/LABS_IMAGING_INTEGRATION.md)** - Lab orders and imaging
- **[Triage System](./docs/features/TRIAGE_SYSTEM.md)** - Patient triage

**Full documentation:** [docs/README.md](./docs/README.md)

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS v4** - Styling
- **shadcn/ui** - UI components
- **React Query** - Server state management

### Backend
- **Next.js API Routes** - RESTful API
- **Medplum** - FHIR server & authentication
- **Firebase** - Firestore (operational DB)
- **Bun** - Package manager & runtime

### Healthcare Standards
- **FHIR R4** - Healthcare data standard
- **SMART on FHIR** - Authorization framework
- **HL7** - Healthcare messaging

---

## 📂 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (routes)/          # Protected routes
│   ├── api/               # API endpoints
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── patients/         # Patient components
│   ├── billing/          # Billing components
│   └── ...
├── lib/                   # Utilities & libraries
│   ├── auth-medplum.tsx  # Client auth
│   ├── server/           # Server utilities
│   ├── fhir/             # FHIR services
│   └── models.ts         # Data models
├── scripts/               # Automation scripts
│   ├── setup/            # Setup scripts
│   ├── migration/        # Data migration
│   ├── dev/              # Dev utilities
│   └── test/             # Test scripts
├── docs/                  # Documentation
│   ├── auth/             # Authentication docs
│   ├── features/         # Feature docs
│   └── rules/            # Project rules
└── middleware.ts          # Auth middleware
```

---

## 🔐 Authentication & Authorization

### User Roles

| Role | Access Level | Use Case |
|------|--------------|----------|
| **Admin** | Full system access | System administrators |
| **Doctor** | All clinical data | Physicians, can prescribe |
| **Nurse** | Limited clinical | Nurses, vitals entry |
| **Billing** | Financial only | Billing staff |
| **Patient** | Own records | Patient portal |

### How It Works

```typescript
// Automatic permission enforcement
const medplum = await requireAuth(req);
const patients = await medplum.searchResources('Patient');
// ↑ Only returns patients user has access to
```

**Learn more:** [Authentication Docs](./docs/auth/README.md)

---

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run start            # Start production server

# Setup
bun run scripts/setup/setup-access-policies.ts  # Create RBAC
bun run scripts/setup/quick-test-medplum.ts     # Test connection

# Testing
bun run test                                    # Run tests
bun run scripts/test/test-lab-imaging.ts        # Test features
```

**Full list:** [scripts/README.md](./scripts/README.md)

### Environment Variables

```bash
# Medplum
MEDPLUM_BASE_URL=http://localhost:8103
NEXT_PUBLIC_MEDPLUM_BASE_URL=http://localhost:8103
MEDPLUM_CLIENT_ID=your-client-id
MEDPLUM_CLIENT_SECRET=your-client-secret

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... other Firebase config

# Access Policies (from setup script)
MEDPLUM_POLICY_ADMIN=AccessPolicy/xxx
MEDPLUM_POLICY_DOCTOR=AccessPolicy/xxx
MEDPLUM_POLICY_NURSE=AccessPolicy/xxx
MEDPLUM_POLICY_BILLING=AccessPolicy/xxx
MEDPLUM_POLICY_PATIENT=AccessPolicy/xxx
```

---

## 🤝 Contributing

1. Follow [Project Rules](./docs/rules/rules.md)
2. Use conventional commits
3. Update documentation
4. Add tests for new features
5. Create feature branch
6. Submit pull request

---

## 📄 License

[Your License Here]

---

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: GitHub Issues
- **Medplum**: https://www.medplum.com/docs
- **FHIR**: https://hl7.org/fhir/

---

## 🗺️ Roadmap

- [x] Patient management
- [x] Consultations & SOAP notes
- [x] Medplum authentication
- [x] Role-based access control
- [x] Lab & imaging orders
- [x] Triage system
- [ ] Telemedicine integration
- [ ] Mobile app
- [ ] HL7 message integration
- [ ] Pharmacy integration
- [ ] Insurance claims

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

**Built with ❤️ for better healthcare**
