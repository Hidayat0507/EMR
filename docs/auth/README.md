# 🔐 Medplum Authentication Documentation

## Quick Start

**New to Medplum auth?** Start here: [Quick Start Guide](./QUICK_START.md)

**Need detailed setup?** See: [Setup Guide](./SETUP.md)

**Developer reference?** Check: [Developer Guide](./DEVELOPER_GUIDE.md)

---

## Documents in this folder

1. **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
2. **[SETUP.md](./SETUP.md)** - Complete setup instructions
3. **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Code examples & patterns
4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues & solutions

---

## What is Medplum Auth?

Your EMR uses **Medplum** for both authentication AND clinical data:

- ✅ **Healthcare-native** - Users are FHIR resources (Practitioner, Patient)
- ✅ **Role-based access control** - 5 roles with fine-grained permissions
- ✅ **Automatic audit trails** - Every action logged
- ✅ **Patient portal ready** - Built-in patient access
- ✅ **Standards-based** - SMART on FHIR compatible

---

## Architecture

```
Login → Medplum Auth → FHIR Profile → AccessPolicy
        ↓
      Session Cookie → Middleware → Routes
                                     ↓
                                  Medplum (Auth + Data)
```

---

## Related Documentation

- **Scripts**: See [scripts/README.md](../../scripts/README.md)
- **Project Rules**: See [docs/rules/rules.md](../rules/rules.md)
- **Features**: See [docs/features/](../features/)








