# 📚 UCC EMR Documentation

Welcome to the UCC EMR documentation! This directory contains all project documentation organized by topic.

---

## 📂 Documentation Structure

```
docs/
├── auth/              # Authentication & authorization
├── features/          # Feature-specific documentation
├── rules/             # Project rules & guidelines
└── README.md          # This file
```

---

## 🔐 Authentication

**Location:** [`docs/auth/`](./auth/)

Documentation for Medplum authentication and role-based access control:

- **[Quick Start](./auth/QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](./auth/SETUP.md)** - Complete setup instructions
- **[Developer Guide](./auth/DEVELOPER_GUIDE.md)** - Code examples & patterns
- **[Troubleshooting](./auth/TROUBLESHOOTING.md)** - Common issues & solutions

**New to auth?** Start with the [Quick Start](./auth/QUICK_START.md) guide.

---

## ✨ Features

**Location:** [`docs/features/`](./features/)

Documentation for specific features:

- **[Labs & Imaging Integration](./features/LABS_IMAGING_INTEGRATION.md)** - Lab orders and imaging
- **[Triage System](./features/TRIAGE_SYSTEM.md)** - Patient triage workflow

---

## 📋 Project Rules

**Location:** [`docs/rules/`](./rules/)

Development guidelines and best practices:

- **[Rules & Best Practices](./rules/rules.md)** - Coding standards
- **[Setup Instructions](./rules/setup.md)** - Development setup

---

## 🚀 Quick Links

### For New Developers

1. **Setup**: Read [rules/setup.md](./rules/setup.md)
2. **Authentication**: Read [auth/QUICK_START.md](./auth/QUICK_START.md)
3. **Scripts**: See [../scripts/README.md](../scripts/README.md)
4. **Start coding**: Check [auth/DEVELOPER_GUIDE.md](./auth/DEVELOPER_GUIDE.md)

### For Operations/DevOps

1. **Deployment**: (Coming soon)
2. **Monitoring**: (Coming soon)
3. **Backup & Recovery**: (Coming soon)

### For Product/Business

1. **Features**: See [features/](./features/)
2. **Roadmap**: See [../CHANGELOG.md](../CHANGELOG.md)
3. **Architecture**: (Coming soon)

---

## 📖 Document Organization

### When to Create New Docs

**Create in `docs/auth/`:**
- Authentication-related guides
- Permission & role documentation
- Security & access control

**Create in `docs/features/`:**
- Feature-specific documentation
- User guides
- Integration guides

**Create in `docs/rules/`:**
- Development standards
- Code style guides
- Process documentation

**Create in root `docs/`:**
- Architecture documents
- Deployment guides
- API documentation (future)

---

## ✍️ Contributing to Documentation

### Documentation Standards

1. **Use Markdown** (`.md` files)
2. **Clear headings** for easy navigation
3. **Code examples** for technical docs
4. **Visual hierarchy** (use headings H1-H4)
5. **Keep it updated** - docs should match code

### Markdown Guidelines

```markdown
# Main Title (H1) - Only one per document

## Major Section (H2)

### Subsection (H3)

#### Minor point (H4)

- Use bullet points for lists
- Keep paragraphs short
- Add code blocks with syntax highlighting:

\```typescript
const example = "like this";
\```

**Bold** for emphasis
*Italic* for terms
`code` for inline code
```

### Links

```markdown
# Relative links (preferred)
[Link text](./other-doc.md)
[Link to section](./doc.md#section-name)

# Absolute links (external only)
[Medplum Docs](https://www.medplum.com/docs)
```

---

## 🔍 Finding Documentation

### By Topic

| Topic | Location |
|-------|----------|
| Authentication | [docs/auth/](./auth/) |
| Lab Orders | [docs/features/LABS_IMAGING_INTEGRATION.md](./features/LABS_IMAGING_INTEGRATION.md) |
| Triage | [docs/features/TRIAGE_SYSTEM.md](./features/TRIAGE_SYSTEM.md) |
| Code Rules | [docs/rules/rules.md](./rules/rules.md) |
| Scripts | [../scripts/README.md](../scripts/README.md) |

### By Role

**Developers:**
- [auth/DEVELOPER_GUIDE.md](./auth/DEVELOPER_GUIDE.md)
- [rules/rules.md](./rules/rules.md)
- [../scripts/README.md](../scripts/README.md)

**DevOps:**
- [rules/setup.md](./rules/setup.md)
- [auth/SETUP.md](./auth/SETUP.md)
- (Deployment docs coming soon)

**Product:**
- [features/](./features/)
- [../CHANGELOG.md](../CHANGELOG.md)
- (Roadmap coming soon)

---

## 🆘 Need Help?

1. **Check documentation** in appropriate folder
2. **Search this repo** for similar issues
3. **Check external docs**:
   - [Medplum Docs](https://www.medplum.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - [FHIR Spec](https://hl7.org/fhir/)

---

## 📝 Documentation TODO

- [ ] Architecture overview
- [ ] API documentation
- [ ] Deployment guide
- [ ] Monitoring & alerting
- [ ] Backup & disaster recovery
- [ ] User guides (for clinicians)
- [ ] Admin guide
- [ ] Performance tuning
- [ ] Security best practices

---

**Last updated:** December 2024
