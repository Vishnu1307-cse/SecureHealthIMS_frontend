import { apiClient } from '../lib/apiClient'
import { API_CONFIG } from '../config/api.config'

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  cancellation_reason?: string
  cancelled_at?: string
  cancelled_by?: string
  created_at: string
  created_by: string
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

export interface CreateAppointmentDto {
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
}

export interface UpdateAppointmentStatusDto {
  status: 'completed' | 'cancelled'
  cancellation_reason?: string
}

/**
 * Create a new appointment (Doctor, Nurse, or Admin only)
 */
export const createAppointment = async (data: CreateAppointmentDto) => {
  return apiClient.post<Appointment>(API_CONFIG.ENDPOINTS.APPOINTMENTS, data)
}

/**
 * Get my appointments (Patient or Doctor view)
 */
export const getMyAppointments = async (params?: { status?: string; from_date?: string; to_date?: string }) => {
  return apiClient.get<{ appointments: Appointment[]; total: number }>(
    API_CONFIG.ENDPOINTS.APPOINTMENTS_ME,
    params
  )
}

/**
 * Get patient appointments (Admin, Doctor, or Nurse)
 */
export const getPatientAppointments = async (patientId: string, params?: { status?: string }) => {
  return apiClient.get<{ appointments: Appointment[]; total: number }>(
    API_CONFIG.ENDPOINTS.APPOINTMENTS_PATIENT(patientId),
    params
  )
}

/**
 * Get single appointment by ID
 */
export const getAppointmentById = async (appointmentId: string) => {
  return apiClient.get<Appointment>(API_CONFIG.ENDPOINTS.APPOINTMENT_BY_ID(appointmentId))
}

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (appointmentId: string, data: UpdateAppointmentStatusDto) => {
  return apiClient.patch<Appointment>(API_CONFIG.ENDPOINTS.APPOINTMENT_STATUS(appointmentId), data)
}
