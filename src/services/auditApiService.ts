import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT'

export interface AuditLog {
  id: string
  user_id: string
  patient_id?: string
  action: AuditAction
  resource: string
  resource_id?: string
  timestamp: string
  ip_address?: string
  details?: any
}

/**
 * Get my audit logs (Patient view - who accessed my data)
 */
export const getMyAuditLogs = async (params?: {
  limit?: number
  offset?: number
  action?: AuditAction
  from_date?: string
  to_date?: string
}) => {
  return apiClient.get<{
    logs: AuditLog[]
    total: number
    summary: {
      recent_access: any[]
      note: string
    }
  }>(API_CONFIG.ENDPOINTS.AUDIT_ME, params as Record<string, string>)
}

/**
 * Get all audit logs (Admin only)
 */
export const getAllAuditLogs = async (params?: {
  limit?: number
  offset?: number
  action?: AuditAction
  user_id?: string
  resource?: string
  from_date?: string
  to_date?: string
}) => {
  return apiClient.get<{
    logs: AuditLog[]
    total: number
  }>(API_CONFIG.ENDPOINTS.AUDIT_ALL, params as Record<string, string>)
}

/**
 * Get patient audit logs (Admin only)
 */
export const getPatientAuditLogs = async (
  patientId: string,
  params?: {
    limit?: number
    offset?: number
    action?: AuditAction
    from_date?: string
    to_date?: string
  }
) => {
  return apiClient.get<{
    logs: AuditLog[]
    total: number
  }>(API_CONFIG.ENDPOINTS.AUDIT_PATIENT(patientId), params as Record<string, string>)
}
