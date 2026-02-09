# Medos — Frontend ↔ Backend Integration Guide

> **Complete step-by-step instructions to connect the React frontend to the Express backend.**
>
> Frontend: `C:\...\Software\frontend` (React + Vite + TypeScript, port 5173)
> Backend: `C:\...\Software\SecureHealthIMS_backend` (Node.js + Express, port 5000)
> Database: Supabase (PostgreSQL)

---

## TABLE OF CONTENTS

1. [Current State Analysis](#1-current-state-analysis)
2. [Prerequisites & Environment Setup](#2-prerequisites--environment-setup)
3. [Database Setup — Run These SQL Scripts](#3-database-setup--run-these-sql-scripts)
4. [Backend Files to Create](#4-backend-files-to-create)
5. [Backend Files to Modify](#5-backend-files-to-modify)
6. [Frontend Files to Modify](#6-frontend-files-to-modify)
7. [API Endpoint Map (Frontend → Backend)](#7-api-endpoint-map-frontend--backend)
8. [Authentication Flow](#8-authentication-flow)
9. [Consent Flow](#9-consent-flow)
10. [Doctor/Nurse Approval Flow](#10-doctornurse-approval-flow)
11. [Profile Setup Flow](#11-profile-setup-flow)
12. [Admin Dashboard Integration](#12-admin-dashboard-integration)
13. [Notification System Integration](#13-notification-system-integration)
14. [Email Service Setup](#14-email-service-setup)
15. [Testing Checklist](#15-testing-checklist)
16. [Common Errors & Fixes](#16-common-errors--fixes)

---

## 1. Current State Analysis

### What the Backend ALREADY HAS ✅

The backend at `SecureHealthIMS_backend/` already has these working:

| Feature | Files | Status |
|---------|-------|--------|
| Express app with CORS, Helmet, rate limiting | `src/app.js` | ✅ Working |
| Supabase client (service role) | `src/config/supabaseClient.js` | ✅ Working |
| Health check endpoint | `src/routes/health.routes.js` | ✅ Working |
| Auth (register, login, logout, me, refresh) | `src/routes/auth.routes.js`, `src/controllers/auth.controller.js` | ✅ Working |
| JWT utilities | `src/utils/jwt.utils.js` | ✅ Working |
| Auth middleware (JWT verify) | `src/middleware/auth.middleware.js` | ✅ Working |
| RBAC middleware | `src/middleware/rbac.middleware.js` | ✅ Working |
| Consent middleware | `src/middleware/consent.middleware.js` | ✅ Working |
| Audit middleware + service | `src/middleware/audit.middleware.js`, `src/services/audit.service.js` | ✅ Working |
| Validation middleware | `src/middleware/validation.middleware.js` | ✅ Working |
| Error handler + custom errors | `src/middleware/errorHandler.middleware.js`, `src/utils/errors.js` | ✅ Working |
| Medical records CRUD | `src/routes/medicalRecords.routes.js` | ✅ Working |
| Appointments CRUD | `src/routes/appointments.routes.js` | ✅ Working |
| Consent endpoints | `src/routes/consent.routes.js` | ✅ Working |
| Audit log endpoints | `src/routes/audit.routes.js` | ✅ Working |
| Visits CRUD | `src/routes/visits.routes.js` | ✅ Working |
| Prescriptions CRUD | `src/routes/prescriptions.routes.js` | ✅ Working |
| Admin endpoints (stats, users, doctors, patients, etc.) | `src/routes/admin.routes.js`, `src/controllers/admin.controller.js` | ✅ Working |
| Patients (legacy, no auth) | `src/routes/patients.routes.js` | ✅ Working |

### What the Backend is MISSING ❌

| Feature | Required For | Action |
|---------|-------------|--------|
| Profile endpoints (`/api/profile/me`, `/api/profile/complete`) | ProfileSetup.tsx, Profile.tsx | **CREATE** `profile.routes.js` + `profile.controller.js` |
| Nurse management (`/api/admin/nurses`, pending nurses) | AdminNurses.tsx | **ADD** to `admin.routes.js` + `admin.controller.js` |
| Notification endpoints (`/api/notifications`) | TopHeader.tsx notification bell | **CREATE** `notifications.routes.js` + `notifications.controller.js` |
| Email service (Nodemailer) | Sending credentials when admin adds doctor/nurse | **CREATE** `src/utils/emailService.js` |
| `nurses` table or nurse fields in `users` | AdminNurses.tsx | **RUN SQL** to add nurse fields to `users` table |
| `notifications` table | Notification bell | **RUN SQL** to create |
| `profile_completed` column in `users` | ProfileSetup redirect logic | **RUN SQL** if missing |
| `approval_status` column in `users` | Doctor/Nurse approval flow | **RUN SQL** if missing |

### What the Frontend Uses

The frontend has **TWO patterns** for API calls:

**Pattern A — Direct Supabase** (used by `authService.ts`, `userService.ts`, `consentService.ts`, `visitService.ts`, `prescriptionService.ts`, `auditService.ts`):
- Calls `supabase.from('table').select/insert/update()` directly
- Uses Supabase anon key + JWT from auth session
- These work WITHOUT the Express backend (they talk to Supabase directly)

**Pattern B — API Client → Express backend** (used by `*ApiService.ts` files like `visitsApiService.ts`, `appointmentsService.ts`, etc.):
- Calls `apiClient.get('/endpoint')` which hits `http://localhost:5000/api/...`
- Uses `Authorization: Bearer <supabase-jwt>` header
- These REQUIRE the Express backend to be running
- Currently defined in `src/config/api.config.ts` but default URL is `http://localhost:3000/api` (needs fixing)

**Pattern C — Mock data** (used by `adminService.ts`, `notificationService.ts`):
- Returns hardcoded arrays with `await delay()`
- Must be replaced with Pattern B calls when backend is ready

---

## 2. Prerequisites & Environment Setup

### Step 1: Backend `.env` file

File: `SecureHealthIMS_backend/.env`
```env
SUPABASE_URL=https://fkqhsgweypbrafwjmnmj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=securehealthims-jwt-secret-key-2026
PORT=5000

# Email (optional, for sending credentials)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=Medos Hospital
```

### Step 2: Frontend `.env` file

File: `frontend/.env`
```env
VITE_SUPABASE_URL=https://fkqhsgweypbrafwjmnmj.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Fix API base URL

The frontend `api.config.ts` defaults to port 3000 but backend runs on 5000. Fix it:

File: `frontend/src/config/api.config.ts` — Change line 2:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
//                                                     ↑ was 3000, change to 5000
```

### Step 4: Install backend dependencies

```bash
cd SecureHealthIMS_backend
npm install
npm install nodemailer    # for email service
```

### Step 5: Start both servers

```bash
# Terminal 1 — Backend
cd SecureHealthIMS_backend
npm run dev
# Should say: Server running on port 5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Should say: Local: http://localhost:5173/
```

> **⚠️ `EADDRINUSE` error?** A previous node process is hogging the port. Run:
> ```bash
> # Find process:
> netstat -ano | findstr :5000
> # Kill it:
> taskkill /PID <PID_NUMBER> /F
> # Or kill all node:
> taskkill /F /IM node.exe
> ```

---

## 3. Database Setup — Run These SQL Scripts

Open the **Supabase SQL Editor** (https://supabase.com/dashboard → your project → SQL Editor) and run these in order.

### Script 1: Core `users` Table (if not exists)

```sql
-- Check if users table exists; if not, create it
CREATE TABLE IF NOT EXISTS users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE,
  full_name       TEXT,
  phone           TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  address         TEXT,
  role            TEXT NOT NULL DEFAULT 'patient'
                  CHECK (role IN ('patient','doctor','nurse','admin')),
  profile_completed BOOLEAN DEFAULT false,

  -- Patient-specific
  blood_group       TEXT,
  emergency_contact TEXT,
  emergency_phone   TEXT,
  allergies         TEXT,
  medical_history   TEXT,

  -- Doctor-specific
  license_number       TEXT,
  specialization       TEXT,
  education            TEXT,
  experience_years     INTEGER,
  hospital_affiliation TEXT,
  visit_fee            NUMERIC(10,2) DEFAULT 0,

  -- Nurse-specific
  nursing_license  TEXT,
  department       TEXT,

  -- Approval
  approval_status  TEXT DEFAULT 'approved'
                   CHECK (approval_status IN ('pending','approved','declined')),

  -- Audit
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

> **If `users` table already exists**, add missing columns:
```sql
-- Add columns only if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS visit_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nursing_license TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### Script 2: Consent Tables

```sql
CREATE TABLE IF NOT EXISTS consents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  has_consented  BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  granted_at     TIMESTAMPTZ,
  revoked_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id)
);

CREATE TABLE IF NOT EXISTS consent_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID NOT NULL REFERENCES users(user_id),
  action       TEXT NOT NULL CHECK (action IN ('grant','revoke','terms_accept')),
  performed_by UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### Script 3: Supporting Tables

```sql
CREATE TABLE IF NOT EXISTS departments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT,
  cost       NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id  UUID REFERENCES users(user_id),
  doctor_id   UUID REFERENCES users(user_id),
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  patient_name TEXT,
  doctor_name  TEXT,
  reason      TEXT,
  status      TEXT DEFAULT 'Pending'
              CHECK (status IN ('Pending','Confirmed','Completed','Cancelled')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id           SERIAL PRIMARY KEY,
  patient_id   UUID REFERENCES users(user_id),
  patient_name TEXT,
  date         DATE DEFAULT CURRENT_DATE,
  total        NUMERIC(10,2) DEFAULT 0,
  status       TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid','Partial')),
  services     TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID REFERENCES users(user_id),
  patient_name TEXT,
  test_name    TEXT NOT NULL,
  description  TEXT,
  result       TEXT DEFAULT 'Pending',
  cost         NUMERIC(10,2) DEFAULT 0,
  date         DATE,
  conducted_by TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES users(user_id),
  doctor_id  UUID REFERENCES users(user_id),
  visit_date TIMESTAMPTZ DEFAULT now(),
  notes      TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id        UUID REFERENCES visits(id),
  patient_id      UUID NOT NULL REFERENCES users(user_id),
  doctor_id       UUID REFERENCES users(user_id),
  medication_name TEXT NOT NULL,
  dosage          TEXT,
  instructions    TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action       TEXT NOT NULL,
  table_name   TEXT,
  record_id    TEXT,
  patient_id   UUID,
  performed_by UUID,
  ip_address   TEXT,
  details      JSONB,
  resource     TEXT,
  resource_id  TEXT,
  user_id      UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

### Script 4: Notifications Table (NEW — required for notification bell)

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN DEFAULT false,
  admin_id   UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Script 5: Seed Initial Data

```sql
-- Departments
INSERT INTO departments (name, description) VALUES
  ('Cardiology', 'Heart and cardiovascular system'),
  ('Neurology', 'Brain and nervous system'),
  ('Orthopedics', 'Bones, joints and muscles'),
  ('Pediatrics', 'Children healthcare'),
  ('Emergency', 'Emergency and trauma care'),
  ('ICU', 'Intensive Care Unit'),
  ('General Ward', 'General medicine'),
  ('Surgery', 'Surgical procedures')
ON CONFLICT (name) DO NOTHING;

-- Services
INSERT INTO services (name, department, cost) VALUES
  ('ECG Test', 'Cardiology', 50),
  ('MRI Scan', 'Neurology', 500),
  ('X-Ray', 'Orthopedics', 75),
  ('Blood Test', 'General Ward', 30),
  ('CT Scan', 'Neurology', 350)
ON CONFLICT DO NOTHING;
```

### Script 6: Enable RLS

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow service_role (backend) to bypass RLS on all tables
CREATE POLICY service_role_all ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON consents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON consent_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON lab_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON notifications FOR ALL USING (true) WITH CHECK (true);
```

> **Note:** The backend uses the `service_role` key which bypasses RLS. The `service_role_all` policies ensure the backend can read/write everything. The frontend uses the `anon` key for auth only and talks to the backend for data.

---

## 4. Backend Files to CREATE

These files **do not exist yet** in the backend. You must create them.

### 4.1 `src/routes/profile.routes.js` (NEW)

```js
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { getProfile, updateProfile, completeProfile } from '../controllers/profile.controller.js'

const router = Router()

router.use(authenticate)

router.get('/me', getProfile)
router.put('/me', updateProfile)
router.put('/complete', completeProfile)

export default router
```

### 4.2 `src/controllers/profile.controller.js` (NEW)

```js
import { supabase } from '../config/supabaseClient.js'

export const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Profile not found' })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const completeProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...req.body,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
```

### 4.3 `src/routes/notifications.routes.js` (NEW)

```js
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notifications.controller.js'

const router = Router()

router.use(authenticate)
router.use(requireRole('admin'))

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)

export default router
```

### 4.4 `src/controllers/notifications.controller.js` (NEW)

```js
import { supabase } from '../config/supabaseClient.js'

export const getNotifications = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getUnreadCount = async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)

    if (error) return res.status(500).json({ error: error.message })
    res.json({ data: { count } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)

    if (error) return res.status(400).json({ error: error.message })
    res.json({ data: { success: true } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
```

### 4.5 `src/utils/emailService.js` (NEW)

```js
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
})

export const sendCredentialsEmail = async (toEmail, fullName, role, tempPassword) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Medos Hospital'}" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Welcome to Medos — Your ${role.charAt(0).toUpperCase() + role.slice(1)} Account`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0f172a; color: white; padding: 30px; border-radius: 12px;">
          <h1 style="margin:0 0 10px;">🏥 Medos Hospital</h1>
          <p style="color:#94a3b8; margin:0;">Health Information Management System</p>
        </div>
        <div style="padding: 30px 20px;">
          <h2>Welcome, ${fullName}!</h2>
          <p>Your <strong>${role}</strong> account has been created. Here are your login credentials:</p>
          <div style="background:#f1f5f9; border-left:4px solid #3b82f6; padding:15px 20px; border-radius:8px; margin:20px 0;">
            <p style="margin:5px 0;"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin:5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color:#ef4444; font-weight:bold;">⚠️ Please change your password after first login.</p>
          <hr style="border:1px solid #e2e8f0; margin:20px 0;" />
          <p style="color:#94a3b8; font-size:12px;">This is an automated message from Medos Hospital.</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (err) {
    console.error('Email send failed:', err.message)
    return { success: false, error: err.message }
  }
}
```

---

## 5. Backend Files to MODIFY

### 5.1 Mount New Routes in `src/app.js`

Add these lines alongside existing route mounts:

```js
// --- ADD these imports ---
import profileRoutes from './routes/profile.routes.js'
import notificationRoutes from './routes/notifications.routes.js'

// --- ADD these mounts (near the other app.use('/api/...') lines) ---
app.use('/api/profile', profileRoutes)
app.use('/api/notifications', notificationRoutes)
```

### 5.2 Add Nurse Endpoints to `src/controllers/admin.controller.js`

The admin controller already handles doctors. Add these functions for nurses:

```js
// GET /api/admin/nurses
export const getNurses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'nurse')
      .eq('approval_status', 'approved')
      .order('full_name')

    if (error) return res.status(500).json({ error: error.message })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/admin/nurses
export const addNurse = async (req, res) => {
  try {
    const { first_name, last_name, email, password, ...rest } = req.body

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (authError) throw authError

    // Create profile
    const { data, error } = await supabase.from('users').insert({
      user_id: authUser.user.id,
      email,
      full_name: `${first_name} ${last_name}`,
      role: 'nurse',
      approval_status: 'approved',
      profile_completed: true,
      ...rest,
    }).select().single()

    if (error) throw error

    // Send email (optional)
    try {
      const { sendCredentialsEmail } = await import('../utils/emailService.js')
      await sendCredentialsEmail(email, `${first_name} ${last_name}`, 'nurse', password)
    } catch (e) { console.warn('Email failed:', e.message) }

    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/admin/pending/nurses
export const getPendingNurses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'nurse')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
```

### 5.3 Add Nurse Routes to `src/routes/admin.routes.js`

Add these routes (alongside existing admin routes):

```js
import { getNurses, addNurse, getPendingNurses } from '../controllers/admin.controller.js'

router.get('/nurses', getNurses)
router.post('/nurses', addNurse)
router.get('/pending/nurses', getPendingNurses)
```

### 5.4 Update Auth Controller Registration

In `src/controllers/auth.controller.js`, the `register` function should:

```js
// When creating user in 'users' table, set approval_status based on role:
const approval_status = (role === 'doctor' || role === 'nurse') ? 'pending' : 'approved'

// Insert into users:
await supabase.from('users').insert({
  user_id: authUser.id,
  email,
  full_name: name,
  role,
  approval_status,
  profile_completed: false,
  // ...other fields
})

// If doctor or nurse, create notification for admin:
if (role === 'doctor' || role === 'nurse') {
  await supabase.from('notifications').insert({
    type: role === 'doctor' ? 'doctor_request' : 'nurse_request',
    title: `New ${role.charAt(0).toUpperCase() + role.slice(1)} Request`,
    message: `${name} has requested to join as a ${role}.`,
  })
}
```

---

## 6. Frontend Files to MODIFY

### 6.1 Fix `api.config.ts` — Change default port

File: `frontend/src/config/api.config.ts`
```typescript
// CHANGE THIS LINE:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
// TO:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

### 6.2 Replace Mock `adminService.ts` with Real API Calls

When the backend is ready, replace the entire `adminService.ts` with:

```typescript
import { apiClient } from '../lib/apiClient'

// Types (keep existing interfaces)
export interface DashboardStats { ... }
// ... all interfaces stay the same ...

// Stats
export const fetchStats = () => apiClient.get<DashboardStats>('/admin/stats')

// Departments
export const fetchDepartments = () => apiClient.get<Department[]>('/admin/departments')
export const addDepartment = (body: { name: string; description?: string }) =>
  apiClient.post<Department>('/admin/departments', body)

// Services
export const fetchServices = () => apiClient.get<Service[]>('/admin/services')
export const addService = (body: { name: string; department: string; cost: number }) =>
  apiClient.post<Service>('/admin/services', body)

// Doctors
export const fetchDoctors = () => apiClient.get<Doctor[]>('/admin/doctors')
export const addDoctor = (body: Partial<Doctor> & { password?: string }) =>
  apiClient.post<Doctor>('/admin/doctors', body)

// Nurses
export const fetchNurses = () => apiClient.get<Nurse[]>('/admin/nurses')
export const addNurse = (body: Partial<Nurse> & { password?: string }) =>
  apiClient.post<Nurse>('/admin/nurses', body)

// Patients
export const fetchPatients = () => apiClient.get<Patient[]>('/admin/patients')

// Appointments
export const fetchAppointments = () => apiClient.get<Appointment[]>('/admin/appointments')
export const addAppointment = (body: Partial<Appointment>) =>
  apiClient.post<Appointment>('/admin/appointments', body)
export const updateAppointment = (id: string, body: Partial<Appointment>) =>
  apiClient.put<Appointment>(`/admin/appointments/${id}`, body)

// Invoices
export const fetchInvoices = () => apiClient.get<Invoice[]>('/admin/invoices')
export const addInvoice = (body: { patient_name: string; total: number; status: string; services: string[] }) =>
  apiClient.post<Invoice>('/admin/invoices', body)

// Lab Tests
export const fetchLabTests = () => apiClient.get<LabTest[]>('/admin/lab-tests')
export const addLabTest = (body: Partial<LabTest>) =>
  apiClient.post<LabTest>('/admin/lab-tests', body)

// Reports
export const fetchReports = (start: string, end: string) =>
  apiClient.get<ReportData>(`/admin/reports?start=${start}&end=${end}`)

// Users & Approvals
export const fetchAllUsers = () => apiClient.get<any[]>('/admin/users')
export const fetchPendingDoctors = () => apiClient.get<PendingRequest[]>('/admin/pending/doctors')
export const fetchPendingNurses = () => apiClient.get<PendingRequest[]>('/admin/pending/nurses')
export const approveDoctor = (id: string) => apiClient.put(`/admin/approve/${id}`, {})
export const approveNurse = (id: string) => apiClient.put(`/admin/approve/${id}`, {})
export const declineDoctor = (id: string) => apiClient.put(`/admin/decline/${id}`, {})
export const declineNurse = (id: string) => apiClient.put(`/admin/decline/${id}`, {})
export const banUser = (id: string, role: string) =>
  apiClient.put(`/admin/users/${id}/ban`, { role })
```

### 6.3 Replace Mock `notificationService.ts` with Real API Calls

```typescript
import { apiClient } from '../lib/apiClient'

export interface Notification {
  id: string
  type: 'doctor_request' | 'nurse_request' | 'system' | 'appointment' | 'info'
  title: string
  message: string
  read: boolean
  created_at: string
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await apiClient.get<Notification[]>('/notifications')
  return data ?? []
}

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
  return data?.count ?? 0
}

export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.patch('/notifications/' + id + '/read', {})
}

export const markAllAsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/read-all', {})
}

export const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
```

> **Note:** `addNotification()` is removed because the backend handles creating notifications server-side when doctor/nurse requests come in.

---

## 7. API Endpoint Map (Frontend → Backend)

Complete mapping of every frontend function to its backend endpoint:

### Auth (Already Working)
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `authService.registerUser()` | `POST /api/auth/register` | ✅ Exists |
| `authService.loginUser()` | Supabase direct (no backend needed) | ✅ Works |
| `authService.logoutUser()` | Supabase direct | ✅ Works |

### User Profile
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `userService.fetchUserProfile(userId)` | `GET /api/profile/me` | ❌ Create `profile.routes.js` |
| `userService.updateUserProfile(userId, data)` | `PUT /api/profile/me` | ❌ Create |
| `userService.ensureUserProfile(user)` | `PUT /api/profile/complete` | ❌ Create |
| `userService.fetchUserRoles(userId)` | Derived from profile data | ✅ No endpoint needed |
| `userService.fetchAllUsers()` | `GET /api/admin/users` | ✅ Exists |
| `userService.updateUserRole(userId, role)` | `PUT /api/admin/users/:id/role` | ⚠️ Verify exists |

### Consent
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `consentService.fetchConsent(patientId)` | `GET /api/consent/me` | ✅ Exists |
| `consentService.updateConsent(patientId, bool)` | `POST /api/consent/grant` or `/revoke` | ✅ Exists |
| `consentService.acceptPrivacyTerms(patientId)` | `POST /api/consent/grant` (with terms flag) | ⚠️ May need update |
| `consentService.fetchConsentHistory(patientId)` | `GET /api/consent/history` | ✅ Exists |

### Visits & Prescriptions
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `visitService.createVisit()` | `POST /api/visits` | ✅ Exists |
| `visitService.fetchPatientHistory(patientId)` | `GET /api/visits/patient/:patientId` | ✅ Exists |
| `prescriptionService.createPrescription()` | `POST /api/prescriptions` | ✅ Exists |
| `prescriptionService.fetchPatientPrescriptions(patientId)` | `GET /api/prescriptions/patient/:patientId` | ✅ Exists |

### Admin Dashboard (Currently Mock)
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `adminService.fetchStats()` | `GET /api/admin/stats` | ✅ Exists |
| `adminService.fetchDepartments()` | `GET /api/admin/departments` | ✅ Exists |
| `adminService.addDepartment()` | `POST /api/admin/departments` | ✅ Exists |
| `adminService.fetchServices()` | `GET /api/admin/services` | ✅ Exists |
| `adminService.addService()` | `POST /api/admin/services` | ✅ Exists |
| `adminService.fetchDoctors()` | `GET /api/admin/doctors` | ✅ Exists |
| `adminService.addDoctor()` | `POST /api/admin/doctors` | ✅ Exists |
| `adminService.fetchNurses()` | `GET /api/admin/nurses` | ❌ Create |
| `adminService.addNurse()` | `POST /api/admin/nurses` | ❌ Create |
| `adminService.fetchPatients()` | `GET /api/admin/patients` | ✅ Exists |
| `adminService.addPatient()` | `POST /api/admin/patients` | ✅ Exists |
| `adminService.fetchAppointments()` | `GET /api/admin/appointments` | ✅ Exists |
| `adminService.addAppointment()` | `POST /api/admin/appointments` | ✅ Exists |
| `adminService.updateAppointment()` | `PUT /api/admin/appointments/:id` | ✅ Exists |
| `adminService.fetchInvoices()` | `GET /api/admin/invoices` | ✅ Exists |
| `adminService.addInvoice()` | `POST /api/admin/invoices` | ✅ Exists |
| `adminService.fetchLabTests()` | `GET /api/admin/lab-tests` | ✅ Exists |
| `adminService.addLabTest()` | `POST /api/admin/lab-tests` | ✅ Exists |
| `adminService.fetchReports()` | `GET /api/admin/reports` | ✅ Exists |
| `adminService.fetchPendingDoctors()` | `GET /api/admin/pending/doctors` | ✅ Exists (as `getPendingDoctors`) |
| `adminService.fetchPendingNurses()` | `GET /api/admin/pending/nurses` | ❌ Create |
| `adminService.approveDoctor(id)` | `PUT /api/admin/approve/:id` | ✅ Exists |
| `adminService.approveNurse(id)` | `PUT /api/admin/approve/:id` | ✅ Same endpoint |
| `adminService.declineDoctor(id)` | `PUT /api/admin/decline/:id` | ⚠️ Verify exists |
| `adminService.declineNurse(id)` | `PUT /api/admin/decline/:id` | ⚠️ Verify exists |
| `adminService.banUser(id, role)` | `PUT /api/admin/ban/:id` | ✅ Exists |
| `adminService.fetchAllUsers()` | `GET /api/admin/users` | ✅ Exists |

### Notifications (Currently Mock)
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `notificationService.fetchNotifications()` | `GET /api/notifications` | ❌ Create |
| `notificationService.getUnreadCount()` | `GET /api/notifications/unread-count` | ❌ Create |
| `notificationService.markAsRead(id)` | `PATCH /api/notifications/:id/read` | ❌ Create |
| `notificationService.markAllAsRead()` | `PATCH /api/notifications/read-all` | ❌ Create |

### Audit
| Frontend Function | Backend Endpoint | Status |
|---|---|---|
| `auditService.logAudit()` | Supabase direct insert to `audit_logs` | ✅ Works |

---

## 8. Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    REGISTRATION                              │
├──────────────────────────────────────────────────────────────┤
│ User fills form → calls registerUser()                       │
│ ↓                                                            │
│ supabase.auth.signUp() → creates auth user in Supabase       │
│ ↓                                                            │
│ Backend POST /api/auth/register → creates row in users table │
│   - role = 'patient' → approval_status = 'approved'          │
│   - role = 'doctor'  → approval_status = 'pending'           │
│   - role = 'nurse'   → approval_status = 'pending'           │
│   - profile_completed = false                                │
│ ↓                                                            │
│ Redirect to /login                                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      LOGIN                                   │
├──────────────────────────────────────────────────────────────┤
│ User enters email/password → calls loginUser()               │
│ ↓                                                            │
│ supabase.auth.signInWithPassword() → returns session + JWT   │
│ ↓                                                            │
│ AuthContext calls ensureUserProfile() → fetches/creates       │
│   user profile from users table                              │
│ ↓                                                            │
│ Login.tsx checks:                                            │
│   1. profile.profile_completed === false? → /profile-setup   │
│   2. role === 'admin'   → /admin/dashboard                   │
│   3. role === 'doctor'  → /doctor/visits                     │
│   4. role === 'nurse'   → /nurse/patients                    │
│   5. role === 'patient' → /consent                           │
└──────────────────────────────────────────────────────────────┘
```

> **Important:** Login uses Supabase directly (no backend call). The JWT from Supabase is used as the Bearer token for all subsequent API calls to the Express backend.

---

## 9. Consent Flow

```
Patient logs in → lands on /consent (ConsentDashboard.tsx)
    ↓
Page loads → fetchConsent(user.id)
    → Supabase: SELECT * FROM consents WHERE patient_id = user.id
    ↓
If no consent record → shows "Grant Consent" button
If has_consented = true → shows "Consent Active" with revoke option
    ↓
Patient clicks "Grant Consent"
    → updateConsent(user.id, true)
    → Supabase: UPSERT consents SET has_consented = true
    → audit log: 'grant_consent'
    → consent_history: INSERT {action: 'grant'}
    ↓
Now patient is visible to doctors/nurses
    ↓
Patient clicks "Revoke Consent"
    → updateConsent(user.id, false)
    → Patient hidden from doctor/nurse patient lists
    → Admin still sees patient
```

---

## 10. Doctor/Nurse Approval Flow

```
Doctor registers → users.approval_status = 'pending'
    → notification created: "Dr. X has requested to join"
    ↓
Doctor logs in → AuthContext loads profile
    → profile.approval_status === 'pending'
    → Frontend should show "Awaiting Admin Approval" message
      (implement this check in DashboardLayout or ProtectedRoute)
    ↓
Admin logs in → /admin/doctors page
    → fetchPendingDoctors() → shows request cards
    → Admin clicks "Accept"
    → approveDoctor(id) → PUT /api/admin/approve/:id
    → Backend: UPDATE users SET approval_status = 'approved'
    ↓
Doctor refreshes → approval_status = 'approved' → full access
```

### Where to Add Approval Check (Frontend)

In `DashboardLayout.tsx` or `ProtectedRoute.tsx`, add:
```typescript
const { profile } = useAuth()

if (profile?.approval_status === 'pending') {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card p-8 text-center max-w-md">
        <h2 className="text-xl font-bold text-amber-400">Awaiting Approval</h2>
        <p className="mt-2 text-slate-400">
          Your account is pending admin approval. You'll receive access once approved.
        </p>
      </div>
    </div>
  )
}
```

---

## 11. Profile Setup Flow

```
User logs in for first time → profile_completed = false
    ↓
Login.tsx checks profile_completed → redirects to /profile-setup
    ↓
ProfileSetup.tsx shows role-specific form:
  - All roles: full_name, phone, date_of_birth, gender, address
  - Patient: blood_group, emergency_contact, emergency_phone, allergies, medical_history
  - Doctor: specialization, education, license_number, experience_years, hospital_affiliation
  - Nurse: nursing_license, department, specialization, experience_years
    ↓
User submits → updateUserProfile(user.id, { ...fields, profile_completed: true })
    → Supabase: UPDATE users SET ... profile_completed = true
    ↓
Redirect to role-specific dashboard
```

---

## 12. Admin Dashboard Integration

The admin dashboard pages use mock data from `adminService.ts`. When migrating:

### Response Format

The backend should return data in this format (matching `apiClient` expectations):
```json
// apiClient.get() expects:
{ "data": [ ... ] }   // for lists
{ "data": { ... } }   // for single items

// apiClient.post() expects:
{ "data": { ... } }   // for created item
```

### Backend Admin Controller Response Format

Ensure all admin controller functions return:
```js
// LIST endpoint
res.json({ data: rows })

// CREATE endpoint
res.json({ data: createdRow })

// UPDATE endpoint
res.json({ data: updatedRow })
```

### Admin Stats Format

The `fetchStats()` function expects:
```json
{
  "data": {
    "doctors": 3,
    "patients": 4,
    "appointments": 4,
    "income": 930
  }
}
```

Backend should query:
```js
const doctors = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'doctor').eq('approval_status', 'approved')
const patients = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient')
const appointments = await supabase.from('appointments').select('*', { count: 'exact', head: true })
const income = await supabase.from('invoices').select('total').eq('status', 'Paid')
// Sum income and return counts
```

---

## 13. Notification System Integration

### Current (Mock): `notificationService.ts`
- In-memory array with fake notifications
- `addNotification()` called from `adminService.ts` when doctor/nurse requests

### Target (Real):
- Backend stores notifications in `notifications` table
- Frontend polls `GET /api/notifications/unread-count` every 30 seconds (TopHeader.tsx already does this)
- Backend auto-creates notifications when:
  - Doctor registers (type: `doctor_request`)
  - Nurse registers (type: `nurse_request`)
  - Appointment is booked (type: `appointment`)
  - System events (type: `system`)

---

## 14. Email Service Setup

### Step 1: Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to https://myaccount.google.com/apppasswords
4. Select **Mail** → **Other** → Name it "Medos Backend"
5. Copy the 16-character password

### Step 2: Add to `.env`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-hospital-email@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Medos Hospital
```

### Step 3: Install Nodemailer

```bash
cd SecureHealthIMS_backend
npm install nodemailer
```

### Step 4: Use in Admin Controller

When admin adds a doctor/nurse directly, call:
```js
import { sendCredentialsEmail } from '../utils/emailService.js'
await sendCredentialsEmail(email, fullName, 'doctor', password)
```

---

## 15. Testing Checklist

### Phase 1: Database & Backend

- [ ] Run all SQL scripts in Supabase SQL Editor (Section 3)
- [ ] Verify tables exist: `users, consents, consent_history, departments, services, appointments, invoices, lab_tests, visits, prescriptions, audit_logs, notifications`
- [ ] Start backend: `npm run dev` → "Server running on port 5000"
- [ ] Test health: `GET http://localhost:5000/api/health` → `{ status: 'ok' }`

### Phase 2: Auth Flow

- [ ] Register as patient → user appears in `users` table with `approval_status = 'approved'`
- [ ] Register as doctor → user appears with `approval_status = 'pending'`
- [ ] Login as patient → redirects to `/profile-setup` (first time) or `/consent`
- [ ] Login as doctor → sees "Awaiting Approval" (if pending)

### Phase 3: Profile

- [ ] Complete profile setup → `profile_completed = true` in users table
- [ ] Edit profile → data updates in users table
- [ ] Subsequent login skips profile-setup

### Phase 4: Consent

- [ ] Patient grants consent → `consents.has_consented = true`
- [ ] Patient visible in doctor's patient list
- [ ] Patient revokes consent → hidden from doctor's list
- [ ] Admin still sees patient regardless

### Phase 5: Admin Dashboard

- [ ] Login as admin → `/admin/dashboard` shows real stats
- [ ] Add doctor from admin panel → credentials email sent
- [ ] Pending doctor request → shows in Awaiting Approval section
- [ ] Approve doctor → doctor can now access dashboard
- [ ] All CRUD operations work (departments, services, patients, appointments, billing, lab tests)

### Phase 6: Notifications

- [ ] Doctor registers → admin sees notification bell update
- [ ] Click notification → marks as read
- [ ] "Mark all as read" clears badge

### Phase 7: Doctor/Nurse Flow

- [ ] Doctor creates visit → appears in patient history
- [ ] Doctor creates prescription → appears in patient prescriptions
- [ ] Nurse views consented patients only

---

## 16. Common Errors & Fixes

### `EADDRINUSE: address already in use :::5000`
**Cause:** Another node process is using port 5000.
**Fix:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
# Or kill all node processes:
taskkill /F /IM node.exe
```

### `401 Unauthorized` on API calls
**Cause:** JWT token not being sent or expired.
**Fix:** Check `apiClient.ts` sends `Authorization: Bearer <token>`. Check Supabase session is valid.

### `403 Forbidden` on admin endpoints
**Cause:** User's role is not 'admin' or `approval_status` is 'pending'.
**Fix:** Check `users` table for the logged-in user's role and approval_status.

### `CORS error` in browser console
**Cause:** Backend CORS not allowing frontend origin.
**Fix:** In `src/app.js`, ensure CORS origin includes `http://localhost:5173`.

### Frontend shows mock data after migration
**Cause:** `adminService.ts` still has mock arrays.
**Fix:** Replace entire file with apiClient calls as shown in Section 6.2.

### `relation "users" does not exist`
**Cause:** SQL tables not created.
**Fix:** Run all SQL scripts from Section 3 in Supabase SQL Editor.

### `null value in column "user_id" violates not-null constraint`
**Cause:** Registration not linking Supabase auth user to users table.
**Fix:** Ensure `user_id` is set to `authUser.user.id` when inserting into users.

### Profile data not loading after login
**Cause:** `fetchUserProfile` queries by `user_id` but column might be named differently.
**Fix:** Verify `users` table has `user_id` column matching `auth.users.id`.

---

## Summary of ALL Files to Create/Modify

### CREATE These Backend Files:
| File | Purpose |
|------|---------|
| `src/routes/profile.routes.js` | Profile get/update/complete endpoints |
| `src/controllers/profile.controller.js` | Profile business logic |
| `src/routes/notifications.routes.js` | Notification CRUD for admin |
| `src/controllers/notifications.controller.js` | Notification business logic |
| `src/utils/emailService.js` | Send login credentials via Gmail |

### MODIFY These Backend Files:
| File | Change |
|------|--------|
| `src/app.js` | Mount `/api/profile` and `/api/notifications` routes |
| `src/controllers/admin.controller.js` | Add `getNurses`, `addNurse`, `getPendingNurses` |
| `src/routes/admin.routes.js` | Add nurse routes |
| `src/controllers/auth.controller.js` | Set `approval_status` + create notification on register |

### MODIFY These Frontend Files:
| File | Change |
|------|--------|
| `src/config/api.config.ts` | Change default port 3000 → 5000 |
| `src/services/adminService.ts` | Replace mock arrays with `apiClient` calls |
| `src/services/notificationService.ts` | Replace mock with `apiClient` calls |

### RUN These SQL Scripts in Supabase:
| Script | Purpose |
|--------|---------|
| Script 1 | `users` table with all role-specific columns |
| Script 2 | `consents` + `consent_history` tables |
| Script 3 | `departments`, `services`, `appointments`, `invoices`, `lab_tests`, `visits`, `prescriptions`, `audit_logs` |
| Script 4 | `notifications` table |
| Script 5 | Seed departments + services |
| Script 6 | Enable RLS + service_role bypass policies |
