import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export interface Visit {
  id: string
  patient_id: string
  doctor_id: string
  visit_date: string
  visit_time: string
  chief_complaint?: string
  findings?: string
  notes?: string
  created_by: string
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

export interface CreateVisitDto {
  patient_id: string
  visit_date: string
  visit_time: string
  chief_complaint?: string
  findings?: string
  notes?: string
}

export interface UpdateVisitDto {
  visit_date?: string
  visit_time?: string
  chief_complaint?: string
  findings?: string
  notes?: string
}

/**
 * Create a new visit (Doctor only)
 */
export const createVisit = async (data: CreateVisitDto) => {
  return apiClient.post<Visit>(API_CONFIG.ENDPOINTS.VISITS, data)
}

/**
 * Get patient visits
 */
export const getPatientVisits = async (patientId: string) => {
  return apiClient.get<{ visits: Visit[]; total: number }>(
    API_CONFIG.ENDPOINTS.VISITS_PATIENT(patientId)
  )
}

/**
 * Get doctor visits
 */
export const getDoctorVisits = async (doctorId: string) => {
  return apiClient.get<{ visits: Visit[]; total: number }>(
    API_CONFIG.ENDPOINTS.VISITS_DOCTOR(doctorId)
  )
}

/**
 * Get visit by ID
 */
export const getVisitById = async (visitId: string) => {
  return apiClient.get<Visit>(API_CONFIG.ENDPOINTS.VISIT_BY_ID(visitId))
}

/**
 * Update visit (Doctor only - creator only)
 */
export const updateVisit = async (visitId: string, data: UpdateVisitDto) => {
  return apiClient.put<Visit>(API_CONFIG.ENDPOINTS.VISIT_BY_ID(visitId), data)
}

/**
 * Delete visit (Doctor only - creator only)
 */
export const deleteVisit = async (visitId: string) => {
  return apiClient.delete<{ message: string }>(API_CONFIG.ENDPOINTS.VISIT_BY_ID(visitId))
}
