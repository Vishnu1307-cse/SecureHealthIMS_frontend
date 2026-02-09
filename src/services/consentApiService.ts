import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export type ConsentType = 'medical_records' | 'data_sharing' | 'research' | 'marketing' | 'emergency_contact'
export type ConsentStatus = 'granted' | 'denied' | 'revoked'

export interface Consent {
  id: string
  patient_id: string
  consent_type: ConsentType
  status: ConsentStatus
  granted_at?: string
  revoked_at?: string
  created_at: string
}

export interface ConsentHistory {
  id: string
  patient_id: string
  consent_type: ConsentType
  previous_status: ConsentStatus | null
  new_status: ConsentStatus
  changed_at: string
  changed_by: string
}

export interface GrantConsentDto {
  consent_type: ConsentType
}

export interface RevokeConsentDto {
  consent_type: ConsentType
}

/**
 * Grant consent for a specific type (Patient only)
 */
export const grantConsent = async (data: GrantConsentDto) => {
  return apiClient.post<Consent>(API_CONFIG.ENDPOINTS.CONSENT_GRANT, data)
}

/**
 * Revoke consent for a specific type (Patient only)
 */
export const revokeConsent = async (data: RevokeConsentDto) => {
  return apiClient.post<Consent>(API_CONFIG.ENDPOINTS.CONSENT_REVOKE, data)
}

/**
 * Get my consents (Patient only)
 */
export const getMyConsents = async () => {
  return apiClient.get<{
    consents: Consent[]
    total: number
    summary: {
      granted: number
      denied: number
      revoked: number
    }
  }>(API_CONFIG.ENDPOINTS.CONSENT_ME)
}

/**
 * Get my consent history (Patient only)
 */
export const getConsentHistory = async () => {
  return apiClient.get<{
    history: ConsentHistory[]
    total: number
    note: string
  }>(API_CONFIG.ENDPOINTS.CONSENT_HISTORY)
}

/**
 * Get patient consents (Admin only)
 */
export const getPatientConsents = async (patientId: string) => {
  return apiClient.get<{
    consents: Consent[]
    total: number
  }>(API_CONFIG.ENDPOINTS.CONSENT_PATIENT(patientId))
}
