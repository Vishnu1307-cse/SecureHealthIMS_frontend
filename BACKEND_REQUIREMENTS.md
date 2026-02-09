# Backend Requirements — Medos Hospital System

> **Complete step-by-step guide to build/fix the backend so it fully supports the frontend.**
>
> Last updated: February 2026

---

## ⚠️ CRITICAL: Schema Mismatch Alert

The backend was built with a **different database schema** than what the frontend expects:

| Aspect | Backend CURRENTLY uses | Frontend EXPECTS |
|--------|----------------------|------------------|
| User profiles | **Separate tables**: `patients` (name, dob, gender…), `doctors` (name, specialization…), minimal `users` (id, role, is_active) | **Unified `users` table** with ALL fields (full_name, role, specialization, blood_group, approval_status, profile_completed…) |
| User ID mapping | `users.id` = `auth.users.id`, then `patients.user_id` / `doctors.user_id` FK to `users.id` | `users.user_id` = `auth.users.id`, everything in one row |
| Consent | `patient_consents` table with `consent_type` (medical_records, data_sharing, etc.) + `status` (granted/denied/revoked) | `consents` table with single `has_consented` boolean |
| Approval | `doctors.verified` / `patients.verified` boolean | `users.approval_status` enum ('pending'/'approved'/'declined') |
| Appointments | `appointments.patient_id` FK → `patients.id`, `doctor_id` FK → `doctors.id`, status: scheduled/completed/cancelled | `appointments.patient_id` FK → `users.user_id`, `doctor_id` FK → `users.user_id`, status: Pending/Confirmed/Completed/Cancelled |

**YOU MUST CHOOSE ONE APPROACH.** This document describes the **Unified `users` table** approach (Option A) which matches the frontend. If you keep the current separate-tables approach (Option B), you must modify every frontend service file instead.

---

## TABLE OF CONTENTS

1. [Step 1: Choose Your Schema Approach](#step-1-choose-your-schema-approach)
2. [Step 2: Run Database Migration SQL](#step-2-run-database-migration-sql)
3. [Step 3: Backend Files to CREATE](#step-3-backend-files-to-create)
4. [Step 4: Backend Files to MODIFY](#step-4-backend-files-to-modify)
5. [Step 5: Install Dependencies](#step-5-install-dependencies)
6. [Step 6: Environment Variables](#step-6-environment-variables)
7. [Step 7: Complete API Endpoint Reference](#step-7-complete-api-endpoint-reference)
8. [Step 8: Business Rules](#step-8-business-rules)
9. [Step 9: Middleware Reference](#step-9-middleware-reference)
10. [Step 10: Email Service Setup](#step-10-email-service-setup)
11. [Step 11: Target File Structure](#step-11-target-file-structure)
12. [Step 12: Testing Checklist](#step-12-testing-checklist)

---

## Step 1: Choose Your Schema Approach

### Option A: Unified `users` Table (RECOMMENDED — matches frontend)

- **One `users` table** stores ALL profile data for patients, doctors, nurses, and admins.
- Frontend already queries `users` table directly via Supabase.
- Simpler to maintain — no JOINs needed across patient/doctor tables.
- **Requires**: Migrating existing `patients`/`doctors` data into `users`, then updating all backend controllers.

### Option B: Keep Separate Tables (current backend)

- Keep `patients`, `doctors` tables as-is.
- **Requires**: Rewriting 10+ frontend service files to query separate tables and do JOINs.
- More work, more complexity, harder to maintain.

**This document follows Option A.** All subsequent steps assume you are migrating to the unified `users` table.

---

## Step 2: Run Database Migration SQL

Open **Supabase SQL Editor** (Dashboard → SQL Editor) and run these scripts **in order**.

### Script 2.1: Create/Update the Unified `users` Table

```sql
-- ================================================
-- STEP 2.1: Unified users table
-- ================================================
-- If users table already exists with minimal columns, add the missing ones.
-- If it doesn't exist, create it fresh.

-- First, drop the existing minimal users table constraint if it references auth.users directly as PK
-- The current schema has: users.id = auth.users.id (PK)
-- The target schema has: users.id (own PK), users.user_id = auth.users.id (UNIQUE)

-- Check if the current users table has the old schema (id as PK referencing auth.users)
-- If so, we need to restructure it.

-- OPTION: If you have NO important data in the current tables, drop and recreate:
-- WARNING: This deletes all existing user/patient/doctor data!

-- Uncomment the following block ONLY if you want a clean start:
/*
DROP TABLE IF EXISTS consent_history CASCADE;
DROP TABLE IF EXISTS patient_consents CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS lab_tests CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
*/

-- Now create the unified users table:
CREATE TABLE IF NOT EXISTS users (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT UNIQUE,
  full_name         TEXT,
  phone             TEXT,
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('male','female','other')),
  address           TEXT,
  role              TEXT NOT NULL DEFAULT 'patient'
                    CHECK (role IN ('patient','doctor','nurse','admin')),
  profile_completed BOOLEAN DEFAULT false,
  is_active         BOOLEAN DEFAULT true,

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
  nursing_license      TEXT,
  department           TEXT,

  -- Approval (for doctor/nurse)
  approval_status      TEXT DEFAULT 'approved'
                       CHECK (approval_status IN ('pending','approved','declined')),

  -- Timestamps
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- If the table already exists, add missing columns:
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
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
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

### Script 2.2: Data Migration (if you have existing data in patients/doctors tables)

```sql
-- ================================================
-- STEP 2.2: Migrate existing data from patients/doctors into unified users
-- ================================================
-- Only run this if you have existing data you want to keep.
-- Skip if doing a fresh start.

-- Migrate patients
INSERT INTO users (user_id, email, full_name, phone, date_of_birth, gender, address, role, profile_completed, approval_status, is_active)
SELECT
  p.user_id,
  p.email,
  p.name,
  p.phone,
  p.dob,
  p.gender,
  p.address,
  'patient',
  true,
  CASE WHEN p.verified = true THEN 'approved' ELSE 'pending' END,
  true
FROM patients p
WHERE p.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = p.user_id AND u.full_name IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  date_of_birth = EXCLUDED.date_of_birth,
  gender = EXCLUDED.gender,
  address = EXCLUDED.address,
  role = 'patient',
  profile_completed = true;

-- Migrate doctors
INSERT INTO users (user_id, email, full_name, phone, specialization, department, role, profile_completed, approval_status, is_active)
SELECT
  d.user_id,
  d.email,
  d.name,
  d.phone,
  d.specialization,
  dept.name,
  'doctor',
  true,
  CASE WHEN d.verified = true THEN 'approved' ELSE 'pending' END,
  true
FROM doctors d
LEFT JOIN departments dept ON d.department_id = dept.id
WHERE d.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.user_id = d.user_id AND u.full_name IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  specialization = EXCLUDED.specialization,
  department = EXCLUDED.department,
  role = 'doctor',
  profile_completed = true;
```

### Script 2.3: Consent Tables (replace patient_consents)

```sql
-- ================================================
-- STEP 2.3: Simple consent table (frontend pattern)
-- ================================================

CREATE TABLE IF NOT EXISTS consents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  patient_id   UUID NOT NULL REFERENCES auth.users(id),
  action       TEXT NOT NULL CHECK (action IN ('grant','revoke','terms_accept')),
  performed_by UUID,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing patient_consents data (if any)
-- The old table has consent_type-based rows; the new table has a single boolean.
-- A patient is considered "consented" if they had ANY granted consent.
INSERT INTO consents (patient_id, has_consented, granted_at, updated_at)
SELECT DISTINCT
  u.user_id,
  true,
  NOW(),
  NOW()
FROM patient_consents pc
JOIN patients p ON pc.patient_id = p.id
JOIN users u ON p.user_id = u.user_id
WHERE pc.status = 'granted'
ON CONFLICT (patient_id) DO NOTHING;
```

### Script 2.4: Supporting Tables

```sql
-- ================================================
-- STEP 2.4: Departments, services, and admin tables
-- ================================================

-- Departments (likely already exists)
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

-- Recreate appointments to reference users.user_id instead of patients.id/doctors.id
-- Only do this if you want the unified approach. Otherwise keep existing.

-- New-style appointments (if creating fresh):
CREATE TABLE IF NOT EXISTS appointments_new (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID REFERENCES auth.users(id),
  doctor_id    UUID REFERENCES auth.users(id),
  patient_name TEXT,
  doctor_name  TEXT,
  date         DATE NOT NULL,
  time         TIME NOT NULL,
  reason       TEXT,
  status       TEXT DEFAULT 'Pending'
               CHECK (status IN ('Pending','Confirmed','Completed','Cancelled')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- If you already have an appointments table with data, keep using it.
-- The admin controller already stores patient_name/doctor_name as text,
-- so FK references are optional for the admin CRUD.

CREATE TABLE IF NOT EXISTS invoices (
  id            SERIAL PRIMARY KEY,
  patient_id    UUID,
  patient_name  TEXT,
  date          DATE DEFAULT CURRENT_DATE,
  total         NUMERIC(10,2) DEFAULT 0,
  status        TEXT DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid','Partial')),
  services      TEXT[],
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lab_tests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id    UUID,
  patient_name  TEXT,
  test_name     TEXT NOT NULL,
  description   TEXT,
  result        TEXT DEFAULT 'Pending',
  cost          NUMERIC(10,2) DEFAULT 0,
  date          DATE,
  conducted_by  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Visits & prescriptions with user_id references
CREATE TABLE IF NOT EXISTS visits (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id   UUID NOT NULL,
  doctor_id    UUID,
  visit_date   TIMESTAMPTZ DEFAULT now(),
  visit_time   TIME,
  chief_complaint TEXT,
  findings     TEXT,
  notes        TEXT,
  created_by   UUID,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id        UUID REFERENCES visits(id),
  patient_id      UUID NOT NULL,
  doctor_id       UUID,
  medication_name TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  duration        TEXT,
  instructions    TEXT,
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_records (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id  UUID NOT NULL,
  doctor_id   UUID,
  diagnosis   TEXT,
  prescription TEXT,
  notes       TEXT,
  created_by  UUID,
  updated_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action       TEXT NOT NULL,
  resource     TEXT,
  resource_id  TEXT,
  table_name   TEXT,
  record_id    TEXT,
  patient_id   UUID,
  performed_by UUID,
  user_id      UUID,
  ip_address   TEXT,
  user_agent   TEXT,
  request_id   TEXT,
  details      JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  timestamp    TIMESTAMPTZ DEFAULT now()
);
```

### Script 2.5: Notifications Table (NEW)

```sql
-- ================================================
-- STEP 2.5: Notifications table (for admin notification bell)
-- ================================================

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

### Script 2.6: Seed Data

```sql
-- ================================================
-- STEP 2.6: Seed departments and services
-- ================================================

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

INSERT INTO services (name, department, cost) VALUES
  ('ECG Test', 'Cardiology', 50),
  ('MRI Scan', 'Neurology', 500),
  ('X-Ray', 'Orthopedics', 75),
  ('Blood Test', 'General Ward', 30),
  ('CT Scan', 'Neurology', 350)
ON CONFLICT DO NOTHING;
```

### Script 2.7: Enable RLS + Policies

```sql
-- ================================================
-- STEP 2.7: Row Level Security
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Service-role bypass (backend uses service_role key)
-- These allow the backend to read/write everything
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','consents','consent_history','departments',
    'services','invoices','lab_tests','audit_logs','notifications'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS service_role_bypass ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY service_role_bypass ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- Patient reads own profile
CREATE POLICY IF NOT EXISTS users_self_read ON users
  FOR SELECT USING (auth.uid() = user_id);

-- Patient updates own profile
CREATE POLICY IF NOT EXISTS users_self_update ON users
  FOR UPDATE USING (auth.uid() = user_id);

-- Doctor/Nurse reads consented patients + self
CREATE POLICY IF NOT EXISTS users_staff_read ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u2 WHERE u2.user_id = auth.uid() AND u2.role IN ('doctor','nurse')
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM consents c WHERE c.patient_id = users.user_id AND c.has_consented = true
      )
    )
  );

-- Admin reads all
CREATE POLICY IF NOT EXISTS users_admin_all ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u2 WHERE u2.user_id = auth.uid() AND u2.role = 'admin')
  );

-- Consent: patient manages own
CREATE POLICY IF NOT EXISTS consents_self ON consents
  FOR ALL USING (auth.uid() = patient_id);

-- Consent: admin reads all
CREATE POLICY IF NOT EXISTS consents_admin ON consents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u2 WHERE u2.user_id = auth.uid() AND u2.role = 'admin')
  );
```

---

## Step 3: Backend Files to CREATE

These files **do not exist** in `SecureHealthIMS_backend/`. Create them.

### 3.1 `src/routes/profile.routes.js`

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

### 3.2 `src/controllers/profile.controller.js`

```js
import { supabase } from '../config/supabaseClient.js'
import { ApiResponse, NotFoundError } from '../utils/errors.js'
import { asyncHandler } from '../middleware/errorHandler.middleware.js'

export const getProfile = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', req.user.id)
    .single()

  if (error || !data) throw new NotFoundError('Profile')
  return ApiResponse.success(res, data)
})

export const updateProfile = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) throw error
  return ApiResponse.success(res, data, 'Profile updated')
})

export const completeProfile = asyncHandler(async (req, res) => {
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

  if (error) throw error
  return ApiResponse.success(res, data, 'Profile completed')
})
```

### 3.3 `src/routes/notifications.routes.js`

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
router.use(authenticate, requireRole('admin'))

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)

export default router
```

### 3.4 `src/controllers/notifications.controller.js`

```js
import { supabase } from '../config/supabaseClient.js'
import { ApiResponse } from '../utils/errors.js'
import { asyncHandler } from '../middleware/errorHandler.middleware.js'

export const getNotifications = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return ApiResponse.success(res, data)
})

export const getUnreadCount = asyncHandler(async (_req, res) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)
  if (error) throw error
  return ApiResponse.success(res, { count })
})

export const markAsRead = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) throw error
  return ApiResponse.success(res, data)
})

export const markAllAsRead = asyncHandler(async (_req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
  if (error) throw error
  return ApiResponse.success(res, { success: true })
})
```

### 3.5 `src/routes/doctor.routes.js`

```js
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'
import { getDoctorPatients, getDoctorAppointments } from '../controllers/doctor.controller.js'

const router = Router()
router.use(authenticate, requireRole('doctor'))

router.get('/patients', getDoctorPatients)
router.get('/appointments', getDoctorAppointments)

export default router
```

### 3.6 `src/controllers/doctor.controller.js`

```js
import { supabase } from '../config/supabaseClient.js'
import { ApiResponse } from '../utils/errors.js'
import { asyncHandler } from '../middleware/errorHandler.middleware.js'

// GET /api/doctor/patients — only patients who have granted consent
export const getDoctorPatients = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'patient')
    .eq('approval_status', 'approved')
    .in('user_id', supabase.from('consents').select('patient_id').eq('has_consented', true))

  // Alternative if the subquery doesn't work:
  // 1. Fetch consented patient_ids
  // 2. Fetch users where user_id in those ids

  if (error) {
    // Fallback approach:
    const { data: consentedIds } = await supabase
      .from('consents')
      .select('patient_id')
      .eq('has_consented', true)

    const ids = (consentedIds || []).map(c => c.patient_id)
    if (ids.length === 0) return ApiResponse.success(res, [])

    const { data: patients, error: pe } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'patient')
      .in('user_id', ids)
      .order('full_name')

    if (pe) throw pe
    return ApiResponse.success(res, patients || [])
  }

  return ApiResponse.success(res, data || [])
})

// GET /api/doctor/appointments — appointments for the logged-in doctor
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', req.user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return ApiResponse.success(res, data || [])
})
```

### 3.7 `src/routes/nurse.routes.js`

```js
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'
import { getNursePatients } from '../controllers/nurse.controller.js'

const router = Router()
router.use(authenticate, requireRole('nurse'))

router.get('/patients', getNursePatients)

export default router
```

### 3.8 `src/controllers/nurse.controller.js`

```js
import { supabase } from '../config/supabaseClient.js'
import { ApiResponse } from '../utils/errors.js'
import { asyncHandler } from '../middleware/errorHandler.middleware.js'

// GET /api/nurse/patients — only patients who have granted consent
export const getNursePatients = asyncHandler(async (_req, res) => {
  const { data: consentedIds } = await supabase
    .from('consents')
    .select('patient_id')
    .eq('has_consented', true)

  const ids = (consentedIds || []).map(c => c.patient_id)
  if (ids.length === 0) return ApiResponse.success(res, [])

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'patient')
    .in('user_id', ids)
    .order('full_name')

  if (error) throw error
  return ApiResponse.success(res, data || [])
})
```

### 3.9 `src/routes/patient.routes.js` (replace the existing legacy file)

```js
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/rbac.middleware.js'
import { getMyHistory, getMyPrescriptions, getMyAccessLogs } from '../controllers/patient.controller.js'

const router = Router()
router.use(authenticate, requireRole('patient'))

router.get('/history', getMyHistory)
router.get('/prescriptions', getMyPrescriptions)
router.get('/access-logs', getMyAccessLogs)

export default router
```

### 3.10 `src/controllers/patient.controller.js`

```js
import { supabase } from '../config/supabaseClient.js'
import { ApiResponse } from '../utils/errors.js'
import { asyncHandler } from '../middleware/errorHandler.middleware.js'

export const getMyHistory = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('patient_id', req.user.id)
    .order('visit_date', { ascending: false })

  if (error) throw error
  return ApiResponse.success(res, data || [])
})

export const getMyPrescriptions = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ApiResponse.success(res, data || [])
})

export const getMyAccessLogs = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('patient_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return ApiResponse.success(res, data || [])
})
```

### 3.11 `src/utils/emailService.js`

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
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0f172a;color:white;padding:30px;border-radius:12px">
          <h1 style="margin:0 0 10px">🏥 Medos Hospital</h1>
          <p style="color:#94a3b8;margin:0">Health Information Management System</p>
        </div>
        <div style="padding:30px 20px">
          <h2>Welcome, ${fullName}!</h2>
          <p>Your <strong>${role}</strong> account has been created. Here are your login credentials:</p>
          <div style="background:#f1f5f9;border-left:4px solid #3b82f6;padding:15px 20px;border-radius:8px;margin:20px 0">
            <p style="margin:5px 0"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin:5px 0"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color:#ef4444;font-weight:bold">⚠️ Please change your password after first login.</p>
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

## Step 4: Backend Files to MODIFY

### 4.1 `src/app.js` — Mount new routes

Add these imports and route mounts:

```js
// ADD these imports alongside existing ones:
import profileRoutes from './routes/profile.routes.js'
import notificationRoutes from './routes/notifications.routes.js'
import doctorRoutes from './routes/doctor.routes.js'
import nurseRoutes from './routes/nurse.routes.js'
// NOTE: Replace existing patientsRoutes import with the new patient.routes.js

// ADD these mounts alongside existing app.use() calls:
app.use('/api/profile', apiLimiter, profileRoutes)
app.use('/api/notifications', apiLimiter, notificationRoutes)
app.use('/api/doctor', apiLimiter, doctorRoutes)
app.use('/api/nurse', apiLimiter, nurseRoutes)
// Replace the old patients route mount:
// OLD: app.use('/api/patients', apiLimiter, patientsRoutes)
// NEW: app.use('/api/patient', apiLimiter, patientRoutes)  // singular — role-specific
```

### 4.2 `src/controllers/auth.controller.js` — Rewrite for unified users table

**CRITICAL CHANGES needed:**

1. **`register`**: Insert into `users` table (not separate `patients`/`doctors` tables).
   - Set `approval_status = 'pending'` for doctor/nurse.
   - Create notification for admin when doctor/nurse registers.
   - Create default consent row for patients.

2. **`login`**: Query `users` table for role + approval_status (not `patients`/`doctors`).
   - Check `approval_status` instead of `verified`.

3. **`getCurrentUser`**: Return data from `users` table (not separate tables).

Replace the full auth controller with:

```js
import { supabase } from '../config/supabaseClient.js'
import { ValidationError, UnauthenticatedError, ConflictError } from '../utils/errors.js'
import { generateToken, verifyToken } from '../utils/jwt.utils.js'

export const register = async (req, res, next) => {
  try {
    const { email, password, role, name, phone, address, specialization,
            department, date_of_birth, gender } = req.body

    if (!email || !password) throw new ValidationError('Email and password are required')
    if (!role || !['patient', 'doctor', 'nurse'].includes(role)) {
      throw new ValidationError('Role must be patient, doctor, or nurse')
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { role }
    })
    if (authError) {
      if (authError.message.includes('already')) throw new ConflictError('Email already registered')
      throw new Error(authError.message)
    }

    const userId = authData.user.id
    const approvalStatus = (role === 'doctor' || role === 'nurse') ? 'pending' : 'approved'

    // Create unified user profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email,
        full_name: name,
        phone: phone || null,
        address: address || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        role,
        specialization: specialization || null,
        department: department || null,
        approval_status: approvalStatus,
        profile_completed: false,
        is_active: true,
      })

    if (userError) {
      await supabase.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create user: ${userError.message}`)
    }

    // Create default consent for patients
    if (role === 'patient') {
      await supabase.from('consents').insert({
        patient_id: userId,
        has_consented: false,
      })
    }

    // Create admin notification for doctor/nurse
    if (role === 'doctor' || role === 'nurse') {
      await supabase.from('notifications').insert({
        type: `${role}_request`,
        title: `New ${role.charAt(0).toUpperCase() + role.slice(1)} Request`,
        message: `${name || email} has requested to join as a ${role}.`,
      })
    }

    // Only give token if approved
    let token = null
    if (approvalStatus === 'approved') {
      token = generateToken({ id: userId, role, email })
    }

    res.status(201).json({
      success: true,
      message: approvalStatus === 'approved'
        ? `${role} registered successfully`
        : 'Registration successful. Account pending admin approval.',
      data: {
        user: { id: userId, email, role },
        ...(token && { token })
      }
    })
  } catch (error) { next(error) }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) throw new ValidationError('Email and password are required')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new UnauthenticatedError('Invalid email or password')

    // Get user from unified users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (userError || !userData) throw new UnauthenticatedError('User account not found')
    if (!userData.is_active) throw new UnauthenticatedError('Account is deactivated')
    if (userData.approval_status === 'pending') throw new UnauthenticatedError('Account pending approval')
    if (userData.approval_status === 'declined') throw new UnauthenticatedError('Account has been declined')

    const token = generateToken({
      id: data.user.id,
      role: userData.role,
      email: data.user.email
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        refresh_token: data.session.refresh_token
      }
    })
  } catch (error) { next(error) }
}

export const logout = async (req, res, next) => {
  try {
    await supabase.auth.signOut()
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) { next(error) }
}

export const getCurrentUser = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', req.user.id)
      .single()

    if (error || !data) throw new UnauthenticatedError('User not found')

    res.json({ success: true, data })
  } catch (error) { next(error) }
}

export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body
    if (!refresh_token) throw new ValidationError('Refresh token required')

    const { data, error } = await supabase.auth.refreshSession({ refresh_token })
    if (error) throw new UnauthenticatedError('Invalid refresh token')

    const { data: userData } = await supabase
      .from('users').select('role').eq('user_id', data.user.id).single()

    const token = generateToken({
      id: data.user.id,
      role: userData?.role || 'patient',
      email: data.user.email
    })

    res.json({
      success: true,
      data: { token, refresh_token: data.session.refresh_token }
    })
  } catch (error) { next(error) }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) throw new ValidationError('Email is required')

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
    })

    res.json({ success: true, message: 'If the email exists, a reset link has been sent' })
  } catch (error) { next(error) }
}

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password) throw new ValidationError('Token and password required')
    if (password.length < 8) throw new ValidationError('Password must be at least 8 characters')

    await supabase.auth.updateUser({ password })
    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) { next(error) }
}
```

### 4.3 `src/controllers/admin.controller.js` — Rewrite for unified users table

Replace all queries that hit `patients`/`doctors` tables with `users` table queries:

```js
// Stats — query users table instead of separate tables
export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [docs, pats, appts, invs] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true })
      .eq('role', 'doctor').eq('approval_status', 'approved'),
    supabase.from('users').select('id', { count: 'exact', head: true })
      .eq('role', 'patient'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('total, status'),
  ])

  const income = (invs.data || [])
    .filter(i => i.status === 'Paid')
    .reduce((s, i) => s + Number(i.total), 0)

  return ApiResponse.success(res, {
    doctors: docs.count ?? 0,
    patients: pats.count ?? 0,
    appointments: appts.count ?? 0,
    income,
  })
})

// Users — query unified users table
export const getAllUsers = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ApiResponse.success(res, data)
})

// Pending doctors
export const getPendingDoctors = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'doctor')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ApiResponse.success(res, data)
})

// Pending nurses (NEW)
export const getPendingNurses = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'nurse')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ApiResponse.success(res, data)
})

// Approve user (works for doctor or nurse)
export const approveUser = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ approval_status: 'approved', updated_at: new Date().toISOString() })
    .eq('user_id', req.params.id)
    .select()
    .single()
  if (error) throw error
  return ApiResponse.success(res, data, 'User approved')
})

// Decline user
export const declineUser = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ approval_status: 'declined', updated_at: new Date().toISOString() })
    .eq('user_id', req.params.id)
    .select()
    .single()
  if (error) throw error
  return ApiResponse.success(res, data, 'User declined')
})

// Ban user
export const banUser = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', req.params.id)
    .select()
    .single()
  if (error) throw error
  return ApiResponse.success(res, data, 'User banned')
})

// Get doctors (approved)
export const getDoctors = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'doctor')
    .eq('approval_status', 'approved')
    .order('full_name')
  if (error) throw error
  return ApiResponse.success(res, data)
})

// Create doctor (admin adds directly)
export const createDoctor = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, phone, department,
          specialization, education, visit_fee } = req.body

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email, password: password || 'TempPass123!', email_confirm: true,
  })
  if (authError) throw authError

  // Create user profile
  const { data, error } = await supabase.from('users').insert({
    user_id: authUser.user.id,
    email,
    full_name: `${first_name || ''} ${last_name || ''}`.trim(),
    phone, department, specialization, education,
    visit_fee: Number(visit_fee) || 0,
    role: 'doctor',
    approval_status: 'approved',
    profile_completed: true,
    is_active: true,
  }).select().single()
  if (error) throw error

  // Send credentials email (optional)
  try {
    const { sendCredentialsEmail } = await import('../utils/emailService.js')
    await sendCredentialsEmail(email, data.full_name, 'doctor', password || 'TempPass123!')
  } catch (e) { console.warn('Email failed:', e.message) }

  return ApiResponse.created(res, data, 'Doctor added')
})

// Get nurses (NEW)
export const getNurses = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'nurse')
    .eq('approval_status', 'approved')
    .order('full_name')
  if (error) throw error
  return ApiResponse.success(res, data)
})

// Create nurse (NEW — admin adds directly)
export const createNurse = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, phone, department,
          nursing_license, specialization } = req.body

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email, password: password || 'TempPass123!', email_confirm: true,
  })
  if (authError) throw authError

  const { data, error } = await supabase.from('users').insert({
    user_id: authUser.user.id,
    email,
    full_name: `${first_name || ''} ${last_name || ''}`.trim(),
    phone, department, nursing_license, specialization,
    role: 'nurse',
    approval_status: 'approved',
    profile_completed: true,
    is_active: true,
  }).select().single()
  if (error) throw error

  try {
    const { sendCredentialsEmail } = await import('../utils/emailService.js')
    await sendCredentialsEmail(email, data.full_name, 'nurse', password || 'TempPass123!')
  } catch (e) { console.warn('Email failed:', e.message) }

  return ApiResponse.created(res, data, 'Nurse added')
})

// Get patients — query users table
export const getPatients = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'patient')
    .order('full_name')
  if (error) throw error
  return ApiResponse.success(res, data)
})

// ... keep existing: getDepartments, createDepartment, getServices, createService,
//     getAppointments, createAppointmentAdmin, updateAppointmentAdmin,
//     getInvoices, createInvoice, getLabTests, createLabTest, getReports
//     (those don't reference patients/doctors tables)
```

### 4.4 `src/routes/admin.routes.js` — Add missing routes

```js
// ADD these new imports and routes:
import { getNurses, createNurse, getPendingNurses, approveUser, declineUser } from '../controllers/admin.controller.js'

// ADD these routes:
router.get('/nurses', getNurses)
router.post('/nurses', createNurse)
router.get('/pending/doctors', getPendingDoctors)   // may need renaming from /requests
router.get('/pending/nurses', getPendingNurses)
router.put('/approve/:id', approveUser)             // replaces old approveDoctor
router.put('/decline/:id', declineUser)
```

### 4.5 `src/controllers/consent.controller.js` — Rewrite for simple consents table

Replace with simpler logic using `consents` table (has_consented boolean):

```js
import { supabase } from '../config/supabaseClient.js'
import { ApiResponse } from '../utils/errors.js'
import { asyncHandler } from '../middleware/errorHandler.middleware.js'

export const grantConsent = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('consents')
    .upsert({
      patient_id: req.user.id,
      has_consented: true,
      granted_at: new Date().toISOString(),
      revoked_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' })
    .select().single()
  if (error) throw error

  // Log to consent_history
  await supabase.from('consent_history').insert({
    patient_id: req.user.id,
    action: 'grant',
    performed_by: req.user.id,
  })

  return ApiResponse.success(res, data, 'Consent granted')
})

export const revokeConsent = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('consents')
    .update({
      has_consented: false,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('patient_id', req.user.id)
    .select().single()
  if (error) throw error

  await supabase.from('consent_history').insert({
    patient_id: req.user.id,
    action: 'revoke',
    performed_by: req.user.id,
  })

  return ApiResponse.success(res, data, 'Consent revoked')
})

export const getMyConsents = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('consents')
    .select('*')
    .eq('patient_id', req.user.id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return ApiResponse.success(res, data || { has_consented: false })
})

export const getConsentHistory = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('consent_history')
    .select('*')
    .eq('patient_id', req.user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ApiResponse.success(res, data || [])
})

export const getPatientConsents = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('consents')
    .select('*')
    .eq('patient_id', req.params.patientId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return ApiResponse.success(res, data || { has_consented: false })
})
```

### 4.6 `src/services/consent.service.js` — Simplify

```js
import { supabase } from '../config/supabaseClient.js'

export class ConsentService {
  static async hasConsent(patientUserId) {
    const { data } = await supabase
      .from('consents')
      .select('has_consented')
      .eq('patient_id', patientUserId)
      .single()
    return data?.has_consented === true
  }
}
```

### 4.7 `src/middleware/consent.middleware.js` — Update

Change `requireMedicalRecordsConsent` to use simplified `ConsentService.hasConsent(userId)`:

```js
// The consent check now just needs the patient's user_id (auth.users.id),
// not the patients table id.
const patientUserId = req.params.patientId || req.body.patient_id
// ...
const hasConsent = await ConsentService.hasConsent(patientUserId)
```

### 4.8 `src/middleware/rbac.middleware.js` — Remove separate-table lookups

Remove all lookups to `patients` and `doctors` tables. Since user data is now in `users`, the `req.user` object from auth middleware already has the role. Remove `requirePatientOrAdmin` lookups to `patients` table and use `req.user.id` directly:

```js
export const requirePatientOrAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new UnauthorizedError('Authentication required')

  if (req.user.role === 'admin') {
    req.isAdmin = true
    return next()
  }

  if (req.user.role !== 'patient') {
    throw new UnauthorizedError('Patients or admins only')
  }

  req.patientId = req.user.id  // user_id IS the patient identifier now
  next()
})

export const requireDoctor = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new UnauthorizedError('Authentication required')
  if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
    throw new UnauthorizedError('Doctor role required')
  }
  req.doctorId = req.user.id  // user_id IS the doctor identifier now
  next()
})
```

### 4.9 `src/config/supabaseClient.js` — Update health check

Change the test query from `patients` to `users`:

```js
export const testSupabaseConnection = async () => {
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error) {
    console.error('Supabase connection failed:', error.message)
  } else {
    console.log('Supabase connected successfully')
  }
}
```

---

## Step 5: Install Dependencies

```bash
cd SecureHealthIMS_backend
npm install nodemailer
```

---

## Step 6: Environment Variables

### Backend `.env` (at `SecureHealthIMS_backend/.env`)

```env
SUPABASE_URL=https://fkqhsgweypbrafwjmnmj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=securehealthims-jwt-secret-key-2026
PORT=5000
FRONTEND_URL=http://localhost:5173

# Email (optional — for sending credentials when admin adds doctor/nurse)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-hospital-email@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Medos Hospital
```

### Frontend `.env` (at `frontend/.env`)

```env
VITE_SUPABASE_URL=https://fkqhsgweypbrafwjmnmj.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:5000/api
```

### How to get a Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Go to https://myaccount.google.com/apppasswords
4. Select **Mail** → **Other (Custom name)** → type "Medos Backend"
5. Copy the 16-character password into `EMAIL_APP_PASSWORD`

---

## Step 7: Complete API Endpoint Reference

Base URL: `http://localhost:5000/api`

### 7.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register (auto-approve patients, pending for doctor/nurse) |
| POST | `/auth/login` | Public | Login via Supabase → returns custom JWT |
| POST | `/auth/logout` | Optional | Logout |
| GET | `/auth/me` | Required | Get current user profile |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |

### 7.2 Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile/me` | All roles | Get current user's full profile from `users` table |
| PUT | `/profile/me` | All roles | Update profile fields |
| PUT | `/profile/complete` | All roles | Save role-specific data + set `profile_completed = true` |

### 7.3 Consent (Patient)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/consent/me` | Patient | Get consent status (`has_consented` boolean) |
| POST | `/consent/grant` | Patient | Grant consent |
| POST | `/consent/revoke` | Patient | Revoke consent |
| GET | `/consent/history` | Patient | Get consent change history |
| GET | `/consent/patient/:patientId` | Admin | View a patient's consent |

### 7.4 Admin — Users & Approvals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | Dashboard stats (doctors, patients, appointments, income) |
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/pending/doctors` | Admin | List doctors with `approval_status = 'pending'` |
| GET | `/admin/pending/nurses` | Admin | List nurses with `approval_status = 'pending'` |
| PUT | `/admin/approve/:userId` | Admin | Set `approval_status = 'approved'` |
| PUT | `/admin/decline/:userId` | Admin | Set `approval_status = 'declined'` |
| PUT | `/admin/ban/:userId` | Admin | Set `is_active = false` |

### 7.5 Admin — Departments & Services

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/departments` | Admin | List departments |
| POST | `/admin/departments` | Admin | Create department |
| GET | `/admin/services` | Admin | List services |
| POST | `/admin/services` | Admin | Create service |

### 7.6 Admin — Doctors & Nurses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/doctors` | Admin | List approved doctors |
| POST | `/admin/doctors` | Admin | Add doctor (creates auth user + profile + sends email) |
| GET | `/admin/nurses` | Admin | List approved nurses |
| POST | `/admin/nurses` | Admin | Add nurse (creates auth user + profile + sends email) |

### 7.7 Admin — Patients, Appointments, Billing, Lab, Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/patients` | Admin | List all patients (regardless of consent) |
| POST | `/admin/patients` | Admin | Register a patient |
| GET | `/admin/appointments` | Admin | List all appointments |
| POST | `/admin/appointments` | Admin | Create appointment |
| PUT | `/admin/appointments/:id` | Admin | Update appointment |
| GET | `/admin/invoices` | Admin | List invoices |
| POST | `/admin/invoices` | Admin | Create invoice |
| GET | `/admin/lab-tests` | Admin | List lab tests |
| POST | `/admin/lab-tests` | Admin | Create lab test |
| GET | `/admin/reports?start=&end=` | Admin | Financial/appointment report |

### 7.8 Admin — Audit

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audit/all` | Admin | All audit logs |
| GET | `/audit/patient/:patientId` | Admin | Audit logs for specific patient |

### 7.9 Doctor

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/patients` | Doctor | List patients with `has_consented = true` |
| GET | `/doctor/appointments` | Doctor | List doctor's appointments |
| POST | `/visits` | Doctor | Create visit record (existing route) |
| POST | `/prescriptions` | Doctor | Create prescription (existing route) |

### 7.10 Nurse

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/nurse/patients` | Nurse | List patients with `has_consented = true` |

### 7.11 Patient

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/patient/history` | Patient | Own visit history |
| GET | `/patient/prescriptions` | Patient | Own prescriptions |
| GET | `/patient/access-logs` | Patient | Own audit trail |
| GET | `/audit/me` | Patient | Audit logs (existing route) |

### 7.12 Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Admin | All notifications |
| GET | `/notifications/unread-count` | Admin | Unread count |
| PATCH | `/notifications/:id/read` | Admin | Mark one as read |
| PATCH | `/notifications/read-all` | Admin | Mark all as read |

---

## Step 8: Business Rules

### 8.1 Consent-Based Access Control
- **Grant consent:** Patient's data visible to doctors/nurses in patient lists.
- **Revoke consent:** Patient hidden from doctor/nurse patient lists. Admin still sees them.
- **Appointment booking** requires `consents.has_consented = true`. Reject with `403` if not.

### 8.2 Doctor/Nurse Approval Flow
1. Doctor/nurse registers → `approval_status = 'pending'`
2. Notification created for admin
3. Login allowed but frontend shows "Awaiting Approval" if `approval_status === 'pending'`
4. Admin approves → `approval_status = 'approved'` → full access
5. Admin declines → `approval_status = 'declined'` → no access

### 8.3 Profile Completion Flow
1. On first login → `profile_completed = false`
2. Frontend redirects to `/profile-setup`
3. User fills role-specific form → `PUT /profile/complete` → `profile_completed = true`
4. Subsequent logins skip profile-setup

### 8.4 Admin Adding Doctor/Nurse Directly
1. Admin fills form → `POST /admin/doctors` or `/admin/nurses`
2. Backend creates auth user + profile (already approved, profile_completed)
3. Backend sends credentials email to the new user
4. New user logs in with temp password → should change password

---

## Step 9: Middleware Reference

### 9.1 Auth Middleware (`auth.middleware.js`)
- Verifies custom JWT (from `jwt.utils.js`)
- Queries `users` table for role + is_active
- Sets `req.user = { id, email, role, is_active }`
- **NOTE:** `req.user.id` is the `auth.users.id` (= `users.user_id`)

### 9.2 Role Middleware (`rbac.middleware.js`)
```js
requireRole('admin')       // single role
requireAnyRole(['admin', 'doctor'])  // multiple roles
requirePatientOrAdmin      // sets req.patientId = req.user.id
requireDoctor              // sets req.doctorId = req.user.id
```

### 9.3 Consent Middleware (`consent.middleware.js`)
```js
requireMedicalRecordsConsent  // checks consents.has_consented for the patient_id
```

### 9.4 Audit Middleware (`audit.middleware.js`)
```js
auditLog('resource_name')  // auto-logs all successful requests
```

---

## Step 10: Email Service Setup

See Step 3.11 for the `emailService.js` file. Usage:

```js
import { sendCredentialsEmail } from '../utils/emailService.js'

// When admin adds doctor/nurse:
await sendCredentialsEmail(email, fullName, 'doctor', temporaryPassword)
```

---

## Step 11: Target File Structure

After completing all steps, the backend should look like:

```
SecureHealthIMS_backend/
├── .env
├── package.json
├── database/
│   ├── schema.sql           (original — can keep for reference)
│   ├── migration.sql         (the unified migration scripts from Step 2)
│   └── seed.sql
└── src/
    ├── app.js                 ← MODIFIED: mount new routes
    ├── server.js
    ├── config/
    │   └── supabaseClient.js  ← MODIFIED: fix health check
    ├── controllers/
    │   ├── admin.controller.js     ← MODIFIED: use users table
    │   ├── appointments.controller.js
    │   ├── audit.controller.js
    │   ├── auth.controller.js      ← MODIFIED: unified users
    │   ├── consent.controller.js   ← MODIFIED: simple boolean
    │   ├── doctor.controller.js    ← NEW
    │   ├── medicalRecords.controller.js
    │   ├── notifications.controller.js  ← NEW
    │   ├── nurse.controller.js     ← NEW
    │   ├── patient.controller.js   ← NEW
    │   ├── prescriptions.controller.js
    │   ├── profile.controller.js   ← NEW
    │   └── visits.controller.js
    ├── middleware/
    │   ├── audit.middleware.js
    │   ├── auth.middleware.js
    │   ├── consent.middleware.js    ← MODIFIED: simplified
    │   ├── errorHandler.middleware.js
    │   ├── rateLimit.middleware.js
    │   ├── rbac.middleware.js       ← MODIFIED: no separate table lookups
    │   └── validation.middleware.js
    ├── routes/
    │   ├── admin.routes.js         ← MODIFIED: add nurse routes
    │   ├── appointments.routes.js
    │   ├── audit.routes.js
    │   ├── auth.routes.js
    │   ├── consent.routes.js
    │   ├── doctor.routes.js        ← NEW
    │   ├── health.routes.js
    │   ├── notifications.routes.js ← NEW
    │   ├── nurse.routes.js         ← NEW
    │   ├── patient.routes.js       ← REPLACED (was legacy)
    │   ├── prescriptions.routes.js
    │   ├── profile.routes.js       ← NEW
    │   └── visits.routes.js
    ├── services/
    │   ├── audit.service.js
    │   └── consent.service.js      ← MODIFIED: simplified
    └── utils/
        ├── emailService.js         ← NEW
        ├── errors.js
        └── jwt.utils.js
```

### Summary: Files to Create vs Modify

| Action | File | Notes |
|--------|------|-------|
| CREATE | `src/routes/profile.routes.js` | Profile CRUD |
| CREATE | `src/controllers/profile.controller.js` | Profile logic |
| CREATE | `src/routes/notifications.routes.js` | Admin notifications |
| CREATE | `src/controllers/notifications.controller.js` | Notification logic |
| CREATE | `src/routes/doctor.routes.js` | Doctor-specific endpoints |
| CREATE | `src/controllers/doctor.controller.js` | Doctor logic |
| CREATE | `src/routes/nurse.routes.js` | Nurse-specific endpoints |
| CREATE | `src/controllers/nurse.controller.js` | Nurse logic |
| CREATE | `src/controllers/patient.controller.js` | Patient-specific endpoints |
| CREATE | `src/utils/emailService.js` | Email credentials sender |
| REPLACE | `src/routes/patient.routes.js` | Was legacy, now role-specific |
| MODIFY | `src/app.js` | Mount 5 new route groups |
| MODIFY | `src/controllers/auth.controller.js` | Unified users table |
| MODIFY | `src/controllers/admin.controller.js` | Unified users table + nurse endpoints |
| MODIFY | `src/controllers/consent.controller.js` | Simple boolean consent |
| MODIFY | `src/routes/admin.routes.js` | Add nurse + approve/decline routes |
| MODIFY | `src/services/consent.service.js` | Simplified |
| MODIFY | `src/middleware/rbac.middleware.js` | Remove separate-table lookups |
| MODIFY | `src/middleware/consent.middleware.js` | Use simplified consent check |
| MODIFY | `src/config/supabaseClient.js` | Fix health check query |

---

## Step 12: Testing Checklist

### Phase 1: Database
- [ ] Run ALL SQL scripts (2.1 through 2.7) in Supabase SQL Editor
- [ ] Verify tables: `users, consents, consent_history, departments, services, appointments, invoices, lab_tests, visits, prescriptions, audit_logs, notifications`
- [ ] Verify `users` table has columns: `user_id, email, full_name, role, profile_completed, approval_status, is_active, specialization, blood_group, nursing_license` etc.

### Phase 2: Backend Startup
- [ ] `npm install` (includes nodemailer)
- [ ] `npm run dev` → "Server running on port 5000"
- [ ] `GET http://localhost:5000/api/health` → `{ status: 'up' }`

### Phase 3: Auth Flow
- [ ] `POST /api/auth/register` patient → `approval_status = 'approved'`, `profile_completed = false`
- [ ] `POST /api/auth/register` doctor → `approval_status = 'pending'`, notification created
- [ ] `POST /api/auth/login` patient → returns user data + JWT
- [ ] `POST /api/auth/login` pending doctor → `401 Account pending approval`
- [ ] `GET /api/auth/me` with valid JWT → returns user profile

### Phase 4: Profile
- [ ] `GET /api/profile/me` → returns full profile from `users` table
- [ ] `PUT /api/profile/complete` with role-specific data → `profile_completed = true`
- [ ] `PUT /api/profile/me` → updates profile fields

### Phase 5: Consent
- [ ] `POST /api/consent/grant` as patient → `has_consented = true`
- [ ] `GET /api/consent/me` → shows consent status
- [ ] `POST /api/consent/revoke` → `has_consented = false`
- [ ] `GET /api/consent/history` → shows grant/revoke entries

### Phase 6: Admin Dashboard
- [ ] `GET /api/admin/stats` → real counts from `users` table
- [ ] `GET /api/admin/doctors` → approved doctors from `users`
- [ ] `GET /api/admin/nurses` → approved nurses from `users`
- [ ] `POST /api/admin/doctors` → creates auth user + profile + sends email
- [ ] `GET /api/admin/pending/doctors` → pending doctors
- [ ] `PUT /api/admin/approve/:id` → approves user
- [ ] All other admin CRUD endpoints work

### Phase 7: Doctor/Nurse Access
- [ ] `GET /api/doctor/patients` → only patients with `has_consented = true`
- [ ] `GET /api/nurse/patients` → only consented patients
- [ ] Patient revokes consent → disappears from doctor/nurse lists
- [ ] Admin still sees all patients regardless

### Phase 8: Notifications
- [ ] Doctor registers → notification appears
- [ ] `GET /api/notifications` → returns notifications
- [ ] `PATCH /api/notifications/:id/read` → marks as read
- [ ] `PATCH /api/notifications/read-all` → marks all read

### Phase 9: End-to-End Frontend
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Register as patient → login → profile setup → consent → dashboard
- [ ] Register as doctor → login → sees "Pending Approval"
- [ ] Login as admin → approve doctor → doctor can now access
- [ ] Admin dashboard shows real data (not mock data)
