# ✅ CORRECT MEDPLUM URLS

**Problem:** You were using the wrong port!

---

## 🎯 **Use Port 3001 for Medplum App**

```
✅ CORRECT: http://localhost:3001  (Medplum App with UI)
❌ WRONG:   http://localhost:8103 (API Server - no UI)
```

---

## 📋 **Quick Steps**

### **1. Open Medplum App**
```
http://localhost:3001
```

### **2. Register Your Account**

Look for **"Sign Up"** or **"Register"** link (usually bottom of login form)

Fill in:
- Email: `dayatfactor@gmail.com`
- Password: `matn0r007`
- First Name: `Hidayat`
- Last Name: `Doctor`

### **3. Complete Registration**

Follow the prompts to finish creating your account

### **4. Login to Your EMR**

Once registered in Medplum, go to:
```
http://localhost:3000/login
```

Use the same credentials:
- Email: `dayatfactor@gmail.com`
- Password: `matn0r007`

---

## 🔍 **Port Reference**

| Port | Service | Purpose |
|------|---------|---------|
| **3001** | Medplum App | 👉 **Use this for user management!** |
| 8103 | Medplum API | Backend API (no UI) |
| 3000 | Your EMR App | Your application |
| 5432 | PostgreSQL | Database |
| 6379 | Redis | Cache |

---

## ✅ **What to Expect at Port 3001**

When you open `http://localhost:3001`, you should see:

1. **Login Form** with:
   - Email field
   - Password field
   - **"Sign Up" or "Register" link** ← Click this!

2. **After Registration**:
   - You'll have a Medplum account
   - You can manage resources
   - You can see the Admin interface

3. **Admin Features**:
   - Once logged in to Medplum App
   - Look for "Admin" or "Settings" menu
   - You can create additional users
   - You can manage your project

---

## 🎯 **TL;DR**

```bash
# 1. Open Medplum App (correct port!)
open http://localhost:3001

# 2. Register account

# 3. Then login to your EMR
open http://localhost:3000/login
```

**That's it!** 🚀

---

## 💡 **Still Having Issues?**

If you can't register at port 3001, try:

### **Option 1: Direct Database Method**
```bash
chmod +x scripts/create-user-docker.sh
./scripts/create-user-docker.sh
```

### **Option 2: Check Medplum Logs**
```bash
docker logs medplum-medplum-app-1 -f
```

### **Option 3: Restart Medplum**
```bash
docker restart medplum-medplum-app-1
docker restart medplum-medplum-server-1
```

---

**Try port 3001 now!** 🎯








