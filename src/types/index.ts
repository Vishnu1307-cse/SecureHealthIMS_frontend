export type Role = 'patient' | 'doctor' | 'nurse' | 'admin'

export interface UserProfile {
  id?: string
  user_id?: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  address?: string | null
  role?: Role | null
}

export interface Consent {
  id: string
  patient_id: string
  has_consented: boolean
  terms_accepted: boolean
  terms_accepted_at?: string | null
  updated_at?: string | null
}

export interface ConsentHistoryItem {
  id: string
  consent_id: string
  action: 'grant' | 'revoke' | 'terms_accept'
  created_at: string
  performed_by: string
}

export interface Visit {
  id: string
  patient_id: string
  created_by: string
  visit_date: string
  notes?: string | null
}

export interface Prescription {
  id: string
  visit_id: string
  patient_id: string
  created_by: string
  medication_name: string
  dosage: string
  instructions?: string | null
  created_at?: string | null
}

export interface AuditLog {
  id: string
  action: string
  table_name: string
  record_id?: string | null
  patient_id?: string | null
  performed_by: string
  created_at: string
}
