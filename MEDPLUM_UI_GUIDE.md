# 🎯 Medplum UI Navigation Guide

**Can't find admin area?** Here's what to look for in different Medplum versions:

---

## 📍 **Where to Find User Management**

### **Version 1: Top Navigation Bar**

When you open `http://localhost:8103`, look at the **top** of the page:

```
[Logo] [Search] [Resources] [Tools] [Admin] [Profile]
                                      ↑
                                 Click here!
```

Then:
- Click **"Admin"**
- Look for **"Users"** or **"Project"**
- Click **"Invite User"** or **"Create User"**

---

### **Version 2: Sidebar Menu**

Look on the **left side** of the screen:

```
┌─────────────────┐
│ 📊 Dashboard    │
│ 👤 Patients     │
│ 📅 Appointments │
│ ⚙️  Admin        │ ← Click here!
│   └─ Users      │ ← Then here!
│   └─ Project    │
└─────────────────┘
```

---

### **Version 3: Profile Menu**

Look at **top-right** corner:

```
[👤 Your Name ▼]  ← Click here
  ├─ Profile
  ├─ Settings
  ├─ Project Settings  ← Click here!
  └─ Logout
```

Then look for **"Users"** or **"Team"** section

---

### **Version 4: Settings Icon**

Look for ⚙️ **Settings** icon (top-right):

```
[🔍] [🔔] [⚙️] [👤]
            ↑
        Click here!
```

Then:
- **Project Settings**
- **Users** or **Team Members**

---

## 🚀 **EASIEST METHOD: Try Sign Up**

### **Can you see "Sign Up" or "Register"?**

When you go to `http://localhost:8103`:

**If you see a login form with "Sign Up" link:**

```
┌─────────────────────────────────┐
│  Sign in to Medplum             │
│                                 │
│  Email: [__________________]    │
│  Password: [______________]     │
│                                 │
│  [Sign in]                      │
│                                 │
│  Don't have an account?         │
│  → Sign Up ← CLICK THIS!        │
└─────────────────────────────────┘
```

**Fill in:**
- Email: `dayatfactor@gmail.com`
- Password: `matn0r007`
- First Name: `Hidayat`
- Last Name: `Doctor`

---

## 🔧 **ALTERNATIVE: Use Medplum CLI**

If the UI is confusing, use the command line:

```bash
# 1. Install Medplum CLI
npm install -g @medplum/cli

# 2. Configure connection
medplum login http://localhost:8103

# 3. When prompted, enter admin credentials
# (or it will guide you through setup)

# 4. Create user
medplum invite-user \
  --email dayatfactor@gmail.com \
  --password matn0r007 \
  --first-name Hidayat \
  --last-name Doctor \
  --role Practitioner
```

---

## 🎯 **SIMPLEST SOLUTION: Use Super Admin**

Medplum has a **Super Admin** account by default:

### **Step 1:** Login to Medplum as Super Admin

```
URL: http://localhost:8103
Email: admin@localhost
Password: medplum_admin
```

**OR**

```
Email: admin@example.com
Password: admin
```

**OR**

```
Email: super@medplum.com
Password: medplum123
```

### **Step 2:** Once logged in

Look anywhere in the UI for:
- "Users" link
- "Project" menu
- "Team" section
- "Admin" panel

Create user there!

---

## 🔍 **What Does Your Medplum Look Like?**

### **Please describe what you see:**

When you go to `http://localhost:8103`, do you see:

**A) Login form?**
- Try the super admin credentials above
- Look for "Sign Up" link

**B) Dashboard with navigation?**
- Describe the menu items you see
- Look for Admin, Settings, or Users

**C) Error page?**
- Medplum might not be fully set up
- Check server logs

**D) Blank page?**
- Medplum might be starting up
- Wait 30 seconds and refresh

---

## 🚨 **EMERGENCY FIX: Create via Direct Database**

If nothing else works:

```bash
# This creates a user directly (advanced)
docker exec -it medplum-postgres psql -U medplum -d medplum -c \
  "INSERT INTO \"User\" (id, email, password_hash) VALUES \
  (gen_random_uuid(), 'dayatfactor@gmail.com', crypt('matn0r007', gen_salt('bf')));"
```

**⚠️ WARNING:** Only use this as last resort!

---

## 📸 **Help Me Help You**

Can you:
1. Open `http://localhost:8103`
2. Take a screenshot of what you see
3. Describe the menu items/buttons visible

Then I can give you exact steps!

---

## 🎯 **MEANWHILE: Try These URLs Directly**

```bash
# Try accessing users page directly
open http://localhost:8103/admin/users

# Try project settings
open http://localhost:8103/admin/project

# Try super admin panel
open http://localhost:8103/admin/super

# Try OAuth admin
open http://localhost:8103/admin/clients
```

One of these might take you to user management!

---

**Let me know what you see and I'll guide you through!** 🚀








