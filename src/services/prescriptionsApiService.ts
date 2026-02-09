import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  visit_id?: string
  medication_name: string
  dosage: string
  frequency: string
  duration?: string
  notes?: string
  created_at: string
  updated_at?: string
  patients?: {
    id: string
    name: string
  }
  doctors?: {
    id: string
    name: string
    specialization?: string
  }
}

export interface CreatePrescriptionDto {
  patient_id: string
  visit_id?: string
  medication_name: string
  dosage: string
  frequency: string
  duration?: string
  notes?: string
}

export interface UpdatePrescriptionDto {
  medication_name?: string
  dosage?: string
  frequency?: string
  duration?: string
  notes?: string
}

/**
 * Create a new prescription (Doctor only)
 */
export const createPrescription = async (data: CreatePrescriptionDto) => {
  return apiClient.post<Prescription>(API_CONFIG.ENDPOINTS.PRESCRIPTIONS, data)
}

/**
 * Get patient prescriptions
 */
export const getPatientPrescriptions = async (patientId: string) => {
  return apiClient.get<{ prescriptions: Prescription[]; total: number }>(
    API_CONFIG.ENDPOINTS.PRESCRIPTIONS_PATIENT(patientId)
  )
}

/**
 * Get doctor prescriptions
 */
export const getDoctorPrescriptions = async (doctorId: string) => {
  return apiClient.get<{ prescriptions: Prescription[]; total: number }>(
    API_CONFIG.ENDPOINTS.PRESCRIPTIONS_DOCTOR(doctorId)
  )
}

/**
 * Get prescription by ID
 */
export const getPrescriptionById = async (prescriptionId: string) => {
  return apiClient.get<Prescription>(API_CONFIG.ENDPOINTS.PRESCRIPTION_BY_ID(prescriptionId))
}

/**
 * Update prescription (Doctor only - creator only)
 */
export const updatePrescription = async (prescriptionId: string, data: UpdatePrescriptionDto) => {
  return apiClient.put<Prescription>(API_CONFIG.ENDPOINTS.PRESCRIPTION_BY_ID(prescriptionId), data)
}

/**
 * Delete prescription (Doctor only - creator only)
 */
export const deletePrescription = async (prescriptionId: string) => {
  return apiClient.delete<{ message: string }>(API_CONFIG.ENDPOINTS.PRESCRIPTION_BY_ID(prescriptionId))
}
