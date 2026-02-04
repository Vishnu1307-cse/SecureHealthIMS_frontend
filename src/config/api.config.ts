// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Medical Records
    MEDICAL_RECORDS: '/medical-records',
    MEDICAL_RECORDS_ME: '/medical-records/me',
    MEDICAL_RECORDS_PATIENT: (patientId: string) => `/medical-records/patient/${patientId}`,
    MEDICAL_RECORD_BY_ID: (recordId: string) => `/medical-records/${recordId}`,

    // Appointments
    APPOINTMENTS: '/appointments',
    APPOINTMENTS_ME: '/appointments/me',
    APPOINTMENTS_PATIENT: (patientId: string) => `/appointments/patient/${patientId}`,
    APPOINTMENT_BY_ID: (appointmentId: string) => `/appointments/${appointmentId}`,
    APPOINTMENT_STATUS: (appointmentId: string) => `/appointments/${appointmentId}/status`,

    // Consent
    CONSENT_GRANT: '/consent/grant',
    CONSENT_REVOKE: '/consent/revoke',
    CONSENT_ME: '/consent/me',
    CONSENT_HISTORY: '/consent/history',
    CONSENT_PATIENT: (patientId: string) => `/consent/patient/${patientId}`,

    // Audit Logs
    AUDIT_ME: '/audit/me',
    AUDIT_ALL: '/audit/all',
    AUDIT_PATIENT: (patientId: string) => `/audit/patient/${patientId}`,

    // Visits
    VISITS: '/visits',
    VISITS_PATIENT: (patientId: string) => `/visits/patient/${patientId}`,
    VISITS_DOCTOR: (doctorId: string) => `/visits/doctor/${doctorId}`,
    VISIT_BY_ID: (visitId: string) => `/visits/${visitId}`,

    // Prescriptions
    PRESCRIPTIONS: '/prescriptions',
    PRESCRIPTIONS_PATIENT: (patientId: string) => `/prescriptions/patient/${patientId}`,
    PRESCRIPTIONS_DOCTOR: (doctorId: string) => `/prescriptions/doctor/${doctorId}`,
    PRESCRIPTION_BY_ID: (prescriptionId: string) => `/prescriptions/${prescriptionId}`,

    // Patients
    PATIENTS: '/patients',
    PATIENT_BY_ID: (patientId: string) => `/patients/${patientId}`,

    // Admin
    ADMIN_STATS: '/admin/stats',
    ADMIN_USERS: '/admin/users',
    ADMIN_REQUESTS: '/admin/requests',
    ADMIN_APPROVE: (id: string) => `/admin/approve/${id}`,
    ADMIN_BAN: (id: string) => `/admin/ban/${id}`,
    ADMIN_DEPARTMENTS: '/admin/departments',
    ADMIN_SERVICES: '/admin/services',
    ADMIN_DOCTORS: '/admin/doctors',
    ADMIN_DOCTOR_BY_ID: (id: string) => `/admin/doctors/${id}`,
    ADMIN_PATIENTS: '/admin/patients',
    ADMIN_PATIENT_BY_ID: (id: string) => `/admin/patients/${id}`,
    ADMIN_APPOINTMENTS: '/admin/appointments',
    ADMIN_APPOINTMENT_BY_ID: (id: string) => `/admin/appointments/${id}`,
    ADMIN_INVOICES: '/admin/invoices',
    ADMIN_LAB_TESTS: '/admin/lab-tests',
    ADMIN_REPORTS: '/admin/reports',
  }
}
