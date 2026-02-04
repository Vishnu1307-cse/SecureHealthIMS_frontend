import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export interface MedicalRecord {
  id: string
  patient_id: string
  doctor_id: string
  diagnosis: string
  prescription: string
  notes: string
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
  doctors?: {
    id: string
    name: string
    specialization?: string
  }
}

export interface CreateMedicalRecordDto {
  patient_id: string
  diagnosis: string
  prescription: string
  notes?: string
}

export interface UpdateMedicalRecordDto {
  diagnosis?: string
  prescription?: string
  notes?: string
}

/**
 * Create a new medical record (Doctor only)
 */
export const createMedicalRecord = async (data: CreateMedicalRecordDto) => {
  return apiClient.post<MedicalRecord>(API_CONFIG.ENDPOINTS.MEDICAL_RECORDS, data)
}

/**
 * Get my medical records (Patient view)
 */
export const getMyMedicalRecords = async () => {
  return apiClient.get<{ records: MedicalRecord[]; total: number }>(
    API_CONFIG.ENDPOINTS.MEDICAL_RECORDS_ME
  )
}

/**
 * Get patient medical records (requires consent)
 */
export const getPatientMedicalRecords = async (patientId: string) => {
  return apiClient.get<{
    patient: { id: string; name: string }
    records: MedicalRecord[]
    total: number
    consent_status: {
      checked: boolean
      granted: boolean
      reason: string
    }
  }>(API_CONFIG.ENDPOINTS.MEDICAL_RECORDS_PATIENT(patientId))
}

/**
 * Get single medical record by ID
 */
export const getMedicalRecordById = async (recordId: string) => {
  return apiClient.get<MedicalRecord>(API_CONFIG.ENDPOINTS.MEDICAL_RECORD_BY_ID(recordId))
}

/**
 * Update medical record (Doctor only - creator only)
 */
export const updateMedicalRecord = async (recordId: string, data: UpdateMedicalRecordDto) => {
  return apiClient.put<MedicalRecord>(API_CONFIG.ENDPOINTS.MEDICAL_RECORD_BY_ID(recordId), data)
}
