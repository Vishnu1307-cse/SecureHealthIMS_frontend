import { supabase } from '../lib/supabaseClient'
import { handleSupabaseError } from './errorHandler'
import { logAudit } from './auditService'

export const fetchConsent = async (patientId: string) => {
  // SUPABASE TABLE: consents
  // WHY: Load current consent status to gate medical data access.
  const { data, error } = await supabase.from('consents').select('*').eq('patient_id', patientId).single()
  handleSupabaseError(error, 'Consent fetch failed')
  if (!error) {
    void logAudit({ action: 'read_consent', tableName: 'consents', recordId: data?.id, patientId })
  }
  return { data, error }
}

export const updateConsent = async (patientId: string, hasConsented: boolean) => {
  // SUPABASE TABLE: consents
  // WHY: Grant/Revoke consent for clinical data access.
  const { data, error } = await supabase
    .from('consents')
    .upsert({ patient_id: patientId, has_consented: hasConsented })
    .select()
    .single()
  handleSupabaseError(error, 'Consent update failed')

  if (!error) {
    void logAudit({ action: hasConsented ? 'grant_consent' : 'revoke_consent', tableName: 'consents', recordId: data?.id, patientId })
  }

  return { data, error }
}

export const acceptPrivacyTerms = async (patientId: string) => {
  // SUPABASE TABLE: consents
  // WHY: Store patient acceptance of privacy terms before enabling consent.
  const { data, error } = await supabase
    .from('consents')
    .upsert({ patient_id: patientId, terms_accepted: true, terms_accepted_at: new Date().toISOString() })
    .select()
    .single()
  handleSupabaseError(error, 'Privacy terms acceptance failed')
  if (!error) {
    void logAudit({ action: 'accept_terms', tableName: 'consents', recordId: data?.id, patientId })
  }
  return { data, error }
}

export const fetchConsentHistory = async (patientId: string) => {
  // SUPABASE TABLE: consent_history
  // WHY: Build a timeline of consent changes for compliance.
  const { data, error } = await supabase
    .from('consent_history')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  handleSupabaseError(error, 'Consent history fetch failed')
  if (!error) {
    void logAudit({ action: 'read_consent_history', tableName: 'consent_history', patientId })
  }
  return { data, error }
}
