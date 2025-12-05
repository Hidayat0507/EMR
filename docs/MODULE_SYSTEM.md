# Modular Feature System

## Overview

The EMR system now features a modular architecture that allows clinics to enable or disable features based on their specific needs. This makes the system flexible and customizable for different types of healthcare facilities.

## Available Modules

### 🩺 Clinical Modules

#### **Triage System**
- **Status**: ✅ Implemented
- **Route**: `/patients/[id]/triage`
- **Description**: Patient triage and priority queue management with 5-level acuity system
- **Features**:
  - 5-level triage scale (Resuscitation → Non-Urgent)
  - Comprehensive vital signs recording
  - Red flags/warning signs
  - Priority-based queue sorting
  - Color-coded visual indicators

### 🔬 Diagnostic Modules

#### **POCT (Point of Care Testing)**
- **Status**: ✅ Implemented
- **Route**: `/poct`
- **Description**: On-site laboratory testing and results management
- **Features**:
  - Multiple test types (Blood glucose, Urinalysis, COVID-19, etc.)
  - Test ordering and tracking
  - Result recording with normal ranges
  - Status tracking (Pending → In Progress → Completed)
  - Quick test definitions library

**Supported Tests**:
- Blood Glucose
- Urinalysis
- Pregnancy Test
- Strep Throat Test
- Influenza Test
- COVID-19 Rapid Test
- Hemoglobin
- Cholesterol Panel
- INR (Coagulation)
- Cardiac Troponin
- BNP

#### **PACS (Medical Imaging)**
- **Status**: ✅ Implemented
- **Route**: `/pacs`
- **Description**: Picture Archiving and Communication System for medical images
- **Features**:
  - Multiple imaging modalities
  - Study ordering and scheduling
  - Image storage and viewing
  - Radiologist reporting
  - Critical findings alerts

**Supported Modalities**:
- X-Ray
- CT Scan
- MRI
- Ultrasound
- ECG
- Echocardiogram

### 📋 Administrative Modules

#### **Inventory Management**
- **Status**: ✅ Already exists
- **Route**: `/inventory`
- **Description**: Medication and supplies inventory tracking
- **Features**:
  - Stock level monitoring
  - Low stock alerts
  - Medication database
  - Procedures tracking

#### **Appointments**
- **Status**: ✅ Already exists
- **Route**: `/appointments`
- **Description**: Appointment scheduling and management
- **Features**:
  - Schedule appointments
  - Check-in management
  - Status tracking
  - Patient notifications

#### **Analytics & Reports**
- **Status**: ✅ Already exists
- **Route**: `/analytics`
- **Description**: Statistical analysis and reporting
- **Features**:
  - Patient statistics
  - Revenue tracking
  - Usage reports
  - Performance metrics

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│     Module Configuration            │
│     (lib/modules.ts)                │
│  - Module definitions               │
│  - Enable/disable logic             │
│  - localStorage persistence         │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│     Settings UI                     │
│  (components/settings/              │
│   module-manager.tsx)               │
│  - Toggle switches                  │
│  - Real-time updates                │
│  - Category grouping                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│     Navigation (Sidebar)            │
│  (components/sidebar.tsx)           │
│  - Dynamic menu items               │
│  - Auto-refresh on toggle           │
│  - Icon mapping                     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│     Module Pages                    │
│  (app/(routes)/[module]/)           │
│  - Check if enabled                 │
│  - Redirect if disabled             │
│  - Module-specific UI               │
└─────────────────────────────────────┘
```

### Data Flow

1. **Module Definition** (`lib/modules.ts`)
   - Defines all available modules
   - Sets default enabled state
   - Provides module metadata (name, description, icon, route)

2. **State Management**
   - Uses `localStorage` for persistence
   - Custom events for real-time updates
   - Automatic synchronization across tabs

3. **UI Components**
   - Settings page shows all modules with toggle switches
   - Sidebar dynamically updates to show/hide menu items
   - Module pages check if they're enabled before rendering

## Usage

### For End Users

#### Enable/Disable Modules

1. Navigate to **Settings** from the sidebar
2. Scroll to the **Feature Modules** section
3. Toggle the switch next to any module
4. The navigation menu updates automatically
5. Changes are saved instantly

#### Access Modules

Enabled modules appear in the sidebar navigation. Click on any module to access its features.

### For Developers

#### Check if a Module is Enabled

```typescript
import { isModuleEnabled } from '@/lib/modules';

if (isModuleEnabled('poct')) {
  // POCT module is enabled
}
```

#### Get All Enabled Modules

```typescript
import { getEnabledModules } from '@/lib/modules';

const modules = getEnabledModules();
// Returns array of enabled Module objects
```

#### Get Modules by Category

```typescript
import { getModulesByCategory } from '@/lib/modules';

const clinicalModules = getModulesByCategory('clinical');
const diagnosticModules = getModulesByCategory('diagnostic');
const adminModules = getModulesByCategory('administrative');
```

#### Protect a Page/Component

```typescript
"use client";

import { useState, useEffect } from "react";
import { isModuleEnabled } from "@/lib/modules";
import { redirect } from "next/navigation";

export default function MyModulePage() {
  const [moduleEnabled, setModuleEnabled] = useState(true);

  useEffect(() => {
    const enabled = isModuleEnabled('my_module');
    setModuleEnabled(enabled);
    
    if (!enabled) {
      redirect('/dashboard');
    }
  }, []);

  if (!moduleEnabled) {
    return null;
  }

  return <div>My Module Content</div>;
}
```

#### Add a New Module

1. **Define the Module** in `lib/modules.ts`:

```typescript
export type ModuleId = 'existing' | 'my_new_module';

export const MODULES: Record<ModuleId, Omit<Module, 'enabled'>> = {
  // ... existing modules
  my_new_module: {
    id: 'my_new_module',
    name: 'My New Feature',
    description: 'Description of the feature',
    icon: 'IconName', // Must exist in ICON_MAP
    route: '/my-feature',
    category: 'clinical', // or 'diagnostic' or 'administrative'
  },
};
```

2. **Add Icon Mapping** in `components/settings/module-manager.tsx`:

```typescript
import { MyIcon } from "lucide-react";

const ICON_MAP = {
  // ... existing icons
  MyIcon,
};
```

3. **Add to Sidebar** in `components/sidebar.tsx`:

```typescript
import { MyIcon } from "lucide-react";

const moduleIconMap: Record<string, LucideIcon> = {
  // ... existing mappings
  MyIcon,
};
```

4. **Create Module Files**:

```
modules/my_new_module/
├── types.ts           # TypeScript types
├── models.ts          # Database functions
└── components/        # React components

app/(routes)/my-feature/
└── page.tsx          # Main page
```

5. **Implement the Page** with module check:

```typescript
"use client";

import { isModuleEnabled } from "@/lib/modules";
// ... implement your module
```

## File Structure

```
lib/
├── modules.ts                          # Core module system

modules/
├── poct/
│   ├── types.ts                       # POCT types
│   ├── poct-models.ts                 # Database functions
│   └── ...
└── pacs/
    ├── types.ts                       # PACS types
    ├── pacs-models.ts                 # Database functions
    └── ...

components/
├── settings/
│   └── module-manager.tsx             # Settings UI
├── sidebar.tsx                        # Dynamic navigation
└── ui/
    └── switch.tsx                     # Toggle switch component

app/(routes)/
├── poct/
│   └── page.tsx                      # POCT main page
└── pacs/
    └── page.tsx                      # PACS main page
```

## Benefits

### 🎯 For Clinics

1. **Customization**: Enable only features you need
2. **Simplified UI**: Cleaner interface with fewer distractions
3. **Cost Control**: Pay only for modules you use (if applicable)
4. **Easy Onboarding**: Start with basic features, add more as needed
5. **Flexibility**: Adapt to changing requirements

### 💻 For Developers

1. **Modular Code**: Clean separation of concerns
2. **Easy Testing**: Test modules independently
3. **Maintainability**: Changes to one module don't affect others
4. **Extensibility**: Easy to add new modules
5. **Reusability**: Share modules across projects

## Environment Variables (Optional)

You can set default module states via environment variables:

```env
# .env.local
NEXT_PUBLIC_MODULE_TRIAGE=true
NEXT_PUBLIC_MODULE_POCT=false
NEXT_PUBLIC_MODULE_PACS=true
NEXT_PUBLIC_MODULE_INVENTORY=true
NEXT_PUBLIC_MODULE_APPOINTMENTS=true
NEXT_PUBLIC_MODULE_ANALYTICS=true
```

**Note**: User preferences in `localStorage` override environment variables.

## Events

The module system emits custom events for real-time updates:

### `moduleToggle`
Fired when a module is enabled/disabled.

```typescript
window.addEventListener('moduleToggle', (event: CustomEvent) => {
  console.log(event.detail); // { moduleId: 'poct', enabled: true }
});
```

### `modulesReset`
Fired when all modules are reset to defaults.

```typescript
window.addEventListener('modulesReset', () => {
  console.log('All modules reset to defaults');
});
```

## Best Practices

1. **Always check module status** in protected pages
2. **Redirect gracefully** when modules are disabled
3. **Use consistent icons** from the Lucide library
4. **Group related features** in the same module
5. **Document module dependencies** if they exist
6. **Test with modules disabled** to ensure graceful degradation
7. **Keep modules independent** to avoid coupling

## Future Enhancements

- [ ] Module dependencies (e.g., PACS requires Inventory)
- [ ] Module marketplace/plugins
- [ ] Role-based module access
- [ ] Module analytics (usage tracking)
- [ ] Server-side module management (database-backed)
- [ ] Module versions and updates
- [ ] Module-specific permissions
- [ ] Bulk enable/disable by category

## Troubleshooting

### Module not appearing in sidebar
1. Check if module is enabled in Settings
2. Verify icon mapping exists in sidebar.tsx
3. Ensure module has a valid `route` defined
4. Refresh the page or clear localStorage

### Module page accessible even when disabled
1. Add module check in the page component
2. Implement redirect to dashboard if disabled
3. Check useEffect implementation

### Changes not persisting
1. Check browser localStorage
2. Verify localStorage is not disabled
3. Check for browser console errors
4. Try clearing localStorage and setting again

## Support

For questions or issues with the module system, refer to:
- Main project documentation
- Individual module documentation
- Development team contact

---

**Last Updated**: December 2024
**System Version**: 1.0.0








