import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export interface Patient {
  id: string
  name: string
  dob?: string
  gender?: 'male' | 'female' | 'other'
  phone?: string
  address?: string
  created_at: string
}

/**
 * Get all patients
 */
export const getAllPatients = async () => {
  return apiClient.get<Patient[]>(API_CONFIG.ENDPOINTS.PATIENTS)
}

/**
 * Get patient by ID
 */
export const getPatientById = async (patientId: string) => {
  return apiClient.get<Patient>(API_CONFIG.ENDPOINTS.PATIENT_BY_ID(patientId))
}

/**
 * Create new patient
 */
export const createPatient = async (data: {
  name: string
  dob?: string
  gender?: 'male' | 'female' | 'other'
  phone?: string
  address?: string
}) => {
  return apiClient.post<Patient>(API_CONFIG.ENDPOINTS.PATIENTS, data)
}
