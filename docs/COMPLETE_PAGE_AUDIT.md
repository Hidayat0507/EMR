# 📊 Complete Page Audit & Fixes

## 🔍 Issues Identified

### 🚨 Critical Issues

1. **Mixed Authentication** ❌
   - Client pages use Firebase `useAuth()`
   - Server pages have no auth checks
   - Should use `useMedplumAuth()` and `requireAuth()`

2. **Module Pages Without Access Checks** ❌
   - PACS, POCT, Triage don't check if module is enabled
   - Users see 404 instead of helpful message

3. **Inconsistent Data Fetching** ❌
   - Some pages use Firestore directly
   - Some use Medplum
   - Mixed patterns across app

4. **Missing Loading States** ❌
   - Several pages don't show loading UI
   - Poor user experience

5. **No Error Boundaries** ❌
   - Errors crash entire pages
   - No graceful degradation

---

## 📋 Page-by-Page Analysis

### ✅ **Core Pages (4)**

| Page | Type | Auth | Loading | Errors | Status |
|------|------|------|---------|--------|--------|
| `/` | Server | ❌ None | ✅ | ❌ | Needs auth |
| `/login` | Client | ✅ Public | ✅ | ✅ | **GOOD** |
| `/logout` | Client | ✅ Works | ✅ | ✅ | **GOOD** |
| `/dashboard` | Client | ⚠️ Firebase | ✅ | ⚠️ | **Need Medplum** |

---

### 👥 **Patient Pages (7)**

| Page | Type | Auth | Loading | Errors | Issues |
|------|------|------|---------|--------|--------|
| `/patients` | Client | ⚠️ Firebase | ✅ | ✅ | Need Medplum auth |
| `/patients/new` | Client | ⚠️ Firebase | ✅ | ✅ | Need Medplum auth |
| `/patients/new/scan` | Client | ⚠️ Firebase | ✅ | ⚠️ | Need error handling |
| `/patients/[id]` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/patients/[id]/consultation` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/patients/[id]/triage` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/patients/[id]/labs-imaging` | Mixed | ⚠️ | ⚠️ | ⚠️ | **Needs review** |

**Priority:** HIGH - Core functionality

---

### 📝 **Consultation Pages (4)**

| Page | Type | Auth | Loading | Errors | Issues |
|------|------|------|---------|--------|--------|
| `/consultations/[id]` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/consultations/[id]/edit` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/consultations/[id]/transcribe` | Client | ⚠️ Firebase | ✅ | ⚠️ | Need Medplum auth |
| `/consultations/transcribe` | Client | ⚠️ Firebase | ✅ | ⚠️ | Need Medplum auth |

**Priority:** HIGH - Core functionality

---

### 📅 **Appointment Pages (3)**

| Page | Type | Auth | Loading | Errors | Issues |
|------|------|------|---------|--------|--------|
| `/appointments` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/appointments/new` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |
| `/appointments/[id]` | Server | ❌ None | ❌ | ⚠️ | **Need auth + loading** |

**Priority:** MEDIUM - Important but not critical

---

### 🏥 **Module Pages (5)**

| Page | Type | Auth | Module Check | Issues |
|------|------|------|--------------|--------|
| `/pacs` | Client | ⚠️ Firebase | ✅ **FIXED** | Updated! |
| `/pacs/new` | Client | ⚠️ Firebase | ❌ | **Need module check** |
| `/poct` | Client | ⚠️ Firebase | ❌ | **Need module check** |
| `/poct/new` | Client | ⚠️ Firebase | ❌ | **Need module check** |
| `/triage` | Server | ❌ None | ❌ | **Need auth + module check** |

**Priority:** MEDIUM - Feature modules

---

### ⚙️ **System Pages (4)**

| Page | Type | Auth | Loading | Issues |
|------|------|------|---------|--------|
| `/settings` | Client | ✅ Firebase | ✅ | ✅ | Good, but use Medplum |
| `/analytics` | Server | ❌ None | ❌ | **Need auth** |
| `/records` | Server | ❌ None | ❌ | **Need auth** |
| `/admin/create-medplum-client` | Server | ❌ None | ❌ | **Need admin auth** |

**Priority:** LOW - Admin/config

---

## 🎯 Fix Strategy

### Phase 1: Authentication (Priority 1) ⚡
**Goal:** All pages use Medplum auth consistently

#### Server Components Pattern:
```typescript
// app/(routes)/[page]/page.tsx
import { getCurrentProfile } from '@/lib/server/medplum-auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  let profile;
  try {
    profile = await getCurrentProfile();
  } catch {
    redirect('/login');
  }
  
  // Rest of page...
}
```

#### Client Components Pattern:
```typescript
'use client';
import { useMedplumAuth } from '@/lib/auth-medplum';

export default function Page() {
  const { profile, isAuthenticated, loading } = useMedplumAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <NotAuthorized />;
  
  // Rest of page...
}
```

**Pages to fix:**
- [x] `/pacs` - DONE ✅
- [ ] All patient pages (7)
- [ ] All consultation pages (4)
- [ ] All appointment pages (3)
- [ ] Module pages (4 remaining)
- [ ] System pages (4)

---

### Phase 2: Module Access Checks (Priority 2) 🔐

**Pattern for Module Pages:**
```typescript
'use client';
import { isModuleEnabled } from '@/lib/modules';
import { useEffect, useState } from 'react';

export default function ModulePage() {
  const [enabled, setEnabled] = useState(true);
  
  useEffect(() => {
    setEnabled(isModuleEnabled('module-id'));
  }, []);
  
  if (!enabled) {
    return <ModuleDisabledMessage />;
  }
  
  // Rest of page...
}
```

**Pages to fix:**
- [x] `/pacs` - DONE ✅
- [ ] `/pacs/new`
- [ ] `/poct`
- [ ] `/poct/new`
- [ ] `/triage`

---

### Phase 3: Loading & Error States (Priority 3) ⏳

**Add to ALL pages:**
```typescript
// Server Components
import { Suspense } from 'react';
import Loading from './loading';
import ErrorBoundary from './error';

export default async function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
}
```

**Create Loading Components:**
- [ ] `/dashboard/loading.tsx`
- [ ] `/patients/loading.tsx`
- [ ] `/patients/[id]/loading.tsx`
- [ ] etc.

**Create Error Components:**
- [ ] `/dashboard/error.tsx`
- [ ] `/patients/error.tsx`
- [ ] `/patients/[id]/error.tsx`
- [ ] etc.

---

### Phase 4: UI/UX Consistency (Priority 4) 🎨

**Standardize:**
- [ ] Page headers (h1 + description)
- [ ] Loading spinners
- [ ] Error messages
- [ ] Button styles
- [ ] Card layouts
- [ ] Table styles

**Pattern:**
```typescript
<div className="space-y-6">
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
    <p className="text-muted-foreground mt-2">Description</p>
  </div>
  
  {/* Content */}
</div>
```

---

### Phase 5: Performance (Priority 5) ⚡

**Optimizations:**
- [ ] Add React Query for caching
- [ ] Implement pagination for lists
- [ ] Lazy load components
- [ ] Optimize images
- [ ] Code splitting
- [ ] Bundle size reduction

---

## 📊 Progress Tracker

### Overall Progress
- **Total Pages:** 29
- **Audited:** 29 ✅
- **Fixed:** 1 (PACS)
- **Remaining:** 28
- **Progress:** 3.4%

### By Priority
- **P1 (Auth):** 0/22 pages
- **P2 (Modules):** 1/5 pages ✅
- **P3 (Loading):** 0/29 pages
- **P4 (UI/UX):** 0/29 pages
- **P5 (Performance):** 0/29 pages

---

## 🚀 Next Actions

### Immediate (Today)
1. ✅ Fix PACS module check
2. ⏳ Fix POCT module check
3. ⏳ Fix Triage module check
4. ⏳ Update dashboard auth
5. ⏳ Update patient list auth

### This Week
6. Fix all patient pages auth
7. Fix all consultation pages auth
8. Add loading states everywhere
9. Create error boundaries
10. Test all pages

### Next Week
11. UI/UX consistency pass
12. Performance optimization
13. Mobile responsiveness
14. Accessibility audit
15. Documentation update

---

## 🔧 Tools & Scripts

### Run Audit
```bash
bun run scripts/dev/audit-pages.ts
```

### Fix All Module Checks
```bash
bun run scripts/dev/fix-module-pages.ts
```

### Add Loading States
```bash
bun run scripts/dev/add-loading-states.ts
```

### Test All Pages
```bash
bun run scripts/test/test-all-pages.ts
```

---

**Last Updated:** December 2024  
**Status:** Phase 1 - In Progress






