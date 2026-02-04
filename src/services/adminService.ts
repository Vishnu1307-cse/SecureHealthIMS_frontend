/**
 * Admin Service — mock data (no backend needed)
 * When backend is ready, swap these back to apiClient calls.
 */

import { addNotification } from './notificationService'

/* ─── Types ─── */
export interface DashboardStats { doctors: number; patients: number; appointments: number; income: number }
export interface Department  { id: string; name: string; description: string }
export interface Service     { id: string; name: string; department: string; cost: number }
export interface Doctor      { id: string; first_name: string; last_name: string; username: string; email: string; phone: string; department: string; specialization: string; education: string; visit_fee: number; status: string; name?: string }
export interface Patient     { id: string; name: string; age: number; gender: string; phone: string; email: string; blood_group: string; address: string; medical_history: string }
export interface Appointment { id: string; date: string; time: string; patient_name: string; doctor_name: string; reason: string; status: string }
export interface Invoice     { id: number; patient_name: string; date: string; total: number; status: string; services: string[] }
export interface LabTest     { id: string; patient_name: string; test_name: string; description: string; result: string; cost: number; date: string; conducted_by: string }
export interface Nurse { id: string; first_name: string; last_name: string; username: string; email: string; phone: string; department: string; specialization: string; nursing_license: string; experience_years: number; status: string }
export interface PendingRequest { id: string; full_name: string; email: string; phone: string; department?: string; specialization: string; education?: string; license_number?: string; nursing_license?: string; experience_years: number; hospital_affiliation?: string; requested_at: string }

/* ─── Mock data stores ─── */
const mockDoctors: Doctor[] = [
  { id: '1', first_name: 'James', last_name: 'Wilson', username: 'jwilson', email: 'james@hospital.com', phone: '+91 98100 10101', department: 'Cardiology', specialization: 'Heart Surgery', education: 'MD Harvard', visit_fee: 150, status: 'Active' },
  { id: '2', first_name: 'Sarah', last_name: 'Chen', username: 'schen', email: 'sarah@hospital.com', phone: '+91 98100 10102', department: 'Neurology', specialization: 'Brain Surgery', education: 'MD Stanford', visit_fee: 200, status: 'Active' },
  { id: '3', first_name: 'Michael', last_name: 'Brown', username: 'mbrown', email: 'michael@hospital.com', phone: '+91 98100 10103', department: 'Orthopedics', specialization: 'Joint Replacement', education: 'MD Johns Hopkins', visit_fee: 175, status: 'Active' },
]

const mockPatients: Patient[] = [
  { id: '1', name: 'John Doe', age: 45, gender: 'Male', phone: '+91 98200 11001', email: 'john@email.com', blood_group: 'A+', address: '12, Nehru Nagar, Mumbai', medical_history: 'Hypertension' },
  { id: '2', name: 'Jane Smith', age: 32, gender: 'Female', phone: '+91 98200 11002', email: 'jane@email.com', blood_group: 'O-', address: '45, MG Road, Delhi', medical_history: 'Asthma' },
  { id: '3', name: 'Robert Johnson', age: 58, gender: 'Male', phone: '+91 98200 11003', email: 'robert@email.com', blood_group: 'B+', address: '78, Anna Salai, Chennai', medical_history: 'Diabetes Type 2' },
  { id: '4', name: 'Emily Davis', age: 27, gender: 'Female', phone: '+91 98200 11004', email: 'emily@email.com', blood_group: 'AB+', address: '32, Park Street, Kolkata', medical_history: 'None' },
]

const mockAppointments: Appointment[] = [
  { id: '1', date: '2026-02-10', time: '09:00', patient_name: 'John Doe', doctor_name: 'James Wilson', reason: 'Chest pain checkup', status: 'Confirmed' },
  { id: '2', date: '2026-02-10', time: '10:30', patient_name: 'Jane Smith', doctor_name: 'Sarah Chen', reason: 'Headache follow-up', status: 'Pending' },
  { id: '3', date: '2026-02-11', time: '14:00', patient_name: 'Robert Johnson', doctor_name: 'Michael Brown', reason: 'Knee pain', status: 'Completed' },
  { id: '4', date: '2026-02-12', time: '11:00', patient_name: 'Emily Davis', doctor_name: 'James Wilson', reason: 'Annual checkup', status: 'Pending' },
]

const mockDepartments: Department[] = [
  { id: '1', name: 'Cardiology', description: 'Heart and cardiovascular system' },
  { id: '2', name: 'Neurology', description: 'Brain and nervous system' },
  { id: '3', name: 'Orthopedics', description: 'Bones, joints and muscles' },
  { id: '4', name: 'Pediatrics', description: 'Children healthcare' },
  { id: '5', name: 'Emergency', description: 'Emergency and trauma care' },
]

const mockServices: Service[] = [
  { id: '1', name: 'ECG Test', department: 'Cardiology', cost: 50 },
  { id: '2', name: 'MRI Scan', department: 'Neurology', cost: 500 },
  { id: '3', name: 'X-Ray', department: 'Orthopedics', cost: 75 },
  { id: '4', name: 'Blood Test', department: 'General', cost: 30 },
  { id: '5', name: 'CT Scan', department: 'Neurology', cost: 350 },
]

const mockInvoices: Invoice[] = [
  { id: 1, patient_name: 'John Doe', date: '2026-02-05', total: 550, status: 'Paid', services: ['ECG Test', 'MRI Scan'] },
  { id: 2, patient_name: 'Jane Smith', date: '2026-02-06', total: 75, status: 'Unpaid', services: ['X-Ray'] },
  { id: 3, patient_name: 'Robert Johnson', date: '2026-02-07', total: 380, status: 'Paid', services: ['Blood Test', 'CT Scan'] },
]

const mockLabTests: LabTest[] = [
  { id: '1', patient_name: 'John Doe', test_name: 'Complete Blood Count', description: 'CBC panel', result: 'Normal', cost: 30, date: '2026-02-05', conducted_by: 'Lab Tech A' },
  { id: '2', patient_name: 'Jane Smith', test_name: 'Thyroid Panel', description: 'TSH, T3, T4', result: 'Pending', cost: 65, date: '2026-02-06', conducted_by: 'Lab Tech B' },
  { id: '3', patient_name: 'Robert Johnson', test_name: 'Lipid Profile', description: 'Cholesterol levels', result: 'Abnormal', cost: 45, date: '2026-02-07', conducted_by: 'Lab Tech A' },
]

const mockNurses: Nurse[] = [
  { id: 'n1', first_name: 'Sarah', last_name: 'Johnson', username: 'sjohnson', email: 'sarah.j@hospital.com', phone: '+91 98300 20001', department: 'ICU', specialization: 'Critical Care', nursing_license: 'NL-10001', experience_years: 8, status: 'Active' },
  { id: 'n2', first_name: 'Maria', last_name: 'Garcia', username: 'mgarcia', email: 'maria.g@hospital.com', phone: '+91 98300 20002', department: 'Pediatrics', specialization: 'Neonatal Care', nursing_license: 'NL-10002', experience_years: 5, status: 'Active' },
  { id: 'n3', first_name: 'Emily', last_name: 'Clark', username: 'eclark', email: 'emily.c@hospital.com', phone: '+91 98300 20003', department: 'Emergency', specialization: 'Trauma Nursing', nursing_license: 'NL-10003', experience_years: 12, status: 'Active' },
]

const mockPendingDoctors: PendingRequest[] = [
  { id: 'pd1', full_name: 'David Lee', email: 'david.lee@email.com', phone: '+91 99001 30001', specialization: 'Dermatology', education: 'MD UCLA', license_number: 'ML-50001', experience_years: 6, hospital_affiliation: 'City General', requested_at: '2026-02-06' },
  { id: 'pd2', full_name: 'Priya Sharma', email: 'priya.s@email.com', phone: '+91 99001 30002', specialization: 'Psychiatry', education: 'MD AIIMS', license_number: 'ML-50002', experience_years: 10, hospital_affiliation: 'Metro Hospital', requested_at: '2026-02-07' },
]

const mockPendingNurses: PendingRequest[] = [
  { id: 'pn1', full_name: 'Lisa Brown', email: 'lisa.b@email.com', phone: '+91 99001 40001', department: 'Cardiology', specialization: 'Cardiac Care', nursing_license: 'NL-60001', experience_years: 4, requested_at: '2026-02-07' },
]

export interface ReportData  { invoices: { date: string; patient_name: string; total: number; status: string }[]; totalIncome: number; totalAppointments: number }
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))
let idCounter = 100
const newId = () => String(++idCounter)

/* ─── Stats ─── */
export const fetchStats = async () => {
  await delay()
  return {
    data: {
      doctors: mockDoctors.length,
      patients: mockPatients.length,
      appointments: mockAppointments.length,
      income: mockInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0),
    } as DashboardStats,
    error: null,
  }
}

/* ─── Departments ─── */
export const fetchDepartments = async () => {
  await delay()
  return { data: [...mockDepartments], error: null }
}
export const addDepartment = async (body: { name: string; description?: string }) => {
  await delay()
  const dept = { id: newId(), name: body.name, description: body.description || '' }
  mockDepartments.push(dept)
  return { data: dept, error: null }
}

/* ─── Services ─── */
export const fetchServices = async () => {
  await delay()
  return { data: [...mockServices], error: null }
}
export const addService = async (body: { name: string; department: string; cost: number }) => {
  await delay()
  const svc = { id: newId(), ...body }
  mockServices.push(svc)
  return { data: svc, error: null }
}

/* ─── Doctors ─── */
export const fetchDoctors = async () => {
  await delay()
  return { data: [...mockDoctors], error: null }
}
export const addDoctor = async (body: Partial<Doctor> & { password?: string }) => {
  await delay()
  const doc = { id: newId(), first_name: '', last_name: '', username: '', email: '', phone: '', department: '', specialization: '', education: '', visit_fee: 0, status: 'Active', ...body } as Doctor
  mockDoctors.push(doc)
  // Notify admin + simulate email sent to doctor
  addNotification('info', 'Doctor Added', `Dr. ${doc.first_name} ${doc.last_name} has been added. Login credentials emailed to ${doc.email}.`)
  return { data: doc, error: null }
}

/* ─── Patients ─── */
export const fetchPatients = async () => {
  await delay()
  return { data: [...mockPatients], error: null }
}
export const addPatient = async (body: Partial<Patient>) => {
  await delay()
  const pat = { id: newId(), name: '', age: 0, gender: 'Male', phone: '', email: '', blood_group: '', address: '', medical_history: '', ...body } as Patient
  mockPatients.push(pat)
  return { data: pat, error: null }
}

/* ─── Appointments ─── */
export const fetchAppointments = async () => {
  await delay()
  return { data: [...mockAppointments], error: null }
}
export const addAppointment = async (body: Partial<Appointment>) => {
  await delay()
  const appt = { id: newId(), date: '', time: '', patient_name: '', doctor_name: '', reason: '', status: 'Pending', ...body } as Appointment
  mockAppointments.push(appt)
  return { data: appt, error: null }
}
export const updateAppointment = async (id: string, body: Partial<Appointment>) => {
  await delay()
  const idx = mockAppointments.findIndex(a => a.id === id)
  if (idx >= 0) mockAppointments[idx] = { ...mockAppointments[idx], ...body }
  return { data: mockAppointments[idx], error: null }
}

/* ─── Invoices ─── */
export const fetchInvoices = async () => {
  await delay()
  return { data: [...mockInvoices], error: null }
}
export const addInvoice = async (body: { patient_name: string; total: number; status: string; services: string[] }) => {
  await delay()
  const inv = { id: mockInvoices.length + 1, date: new Date().toISOString().split('T')[0], ...body }
  mockInvoices.push(inv)
  return { data: inv, error: null }
}

/* ─── Lab Tests ─── */
export const fetchLabTests = async () => {
  await delay()
  return { data: [...mockLabTests], error: null }
}
export const addLabTest = async (body: Partial<LabTest>) => {
  await delay()
  const test = { id: newId(), patient_name: '', test_name: '', description: '', result: 'Pending', cost: 0, date: '', conducted_by: '', ...body } as LabTest
  mockLabTests.push(test)
  return { data: test, error: null }
}

/* ─── Reports ─── */
export const fetchReports = async (startDate: string, endDate: string) => {
  await delay()
  const filtered = mockInvoices.filter(i => i.date >= startDate && i.date <= endDate)
  const apptFiltered = mockAppointments.filter(a => a.date >= startDate && a.date <= endDate)
  return {
    data: {
      invoices: filtered.map(i => ({ date: i.date, patient_name: i.patient_name, total: i.total, status: i.status })),
      totalIncome: filtered.reduce((s, i) => s + i.total, 0),
      totalAppointments: apptFiltered.length,
    } as ReportData,
    error: null,
  }
}

/* ─── Users / Approval ─── */
export const fetchAllUsers = async () => {
  await delay()
  return { data: [
    { id: 'admin-001', email: 'admin@medos.com', role: 'admin', full_name: 'Admin User' },
    { id: 'doctor-001', email: 'doctor@medos.com', role: 'doctor', full_name: 'Dr. Smith' },
    { id: 'nurse-001', email: 'nurse@medos.com', role: 'nurse', full_name: 'Nurse Jane' },
    { id: 'patient-001', email: 'patient@medos.com', role: 'patient', full_name: 'John Patient' },
  ], error: null }
}
export const fetchPendingDoctors = async () => { await delay(); return { data: [...mockPendingDoctors], error: null } }

/** Simulate a doctor submitting a registration request — fires admin notification */
export const submitDoctorRequest = async (body: Omit<PendingRequest, 'id' | 'requested_at'>) => {
  await delay()
  const req = { id: `pd-${newId()}`, ...body, requested_at: new Date().toISOString().split('T')[0] }
  mockPendingDoctors.push(req)
  addNotification('doctor_request', 'New Doctor Request', `Dr. ${req.full_name} has requested to join as a Doctor.`)
  return { data: req, error: null }
}

export const approveDoctor = async (id: string) => {
  await delay()
  const idx = mockPendingDoctors.findIndex(d => d.id === id)
  if (idx >= 0) {
    const req = mockPendingDoctors.splice(idx, 1)[0]
    mockDoctors.push({ id: newId(), first_name: req.full_name.split(' ')[0], last_name: req.full_name.split(' ').slice(1).join(' '), username: req.email.split('@')[0], email: req.email, phone: req.phone, department: 'General', specialization: req.specialization, education: req.education || '', visit_fee: 100, status: 'Active' })
  }
  return { data: { success: true }, error: null }
}
export const declineDoctor = async (id: string) => {
  await delay()
  const idx = mockPendingDoctors.findIndex(d => d.id === id)
  if (idx >= 0) mockPendingDoctors.splice(idx, 1)
  return { data: { success: true }, error: null }
}
export const banUser = async (_id: string, _role: string) => { await delay(); return { data: { success: true }, error: null } }

/* ─── Nurses ─── */
export const fetchNurses = async () => {
  await delay()
  return { data: [...mockNurses], error: null }
}
export const addNurse = async (body: Partial<Nurse> & { password?: string }) => {
  await delay()
  const nurse = { id: newId(), first_name: '', last_name: '', username: '', email: '', phone: '', department: '', specialization: '', nursing_license: '', experience_years: 0, status: 'Active', ...body } as Nurse
  mockNurses.push(nurse)
  return { data: nurse, error: null }
}
export const fetchPendingNurses = async () => { await delay(); return { data: [...mockPendingNurses], error: null } }

/** Simulate a nurse submitting a registration request — fires admin notification */
export const submitNurseRequest = async (body: Omit<PendingRequest, 'id' | 'requested_at'>) => {
  await delay()
  const req = { id: `pn-${newId()}`, ...body, requested_at: new Date().toISOString().split('T')[0] }
  mockPendingNurses.push(req)
  addNotification('nurse_request', 'New Nurse Request', `${req.full_name} has requested to join as a Nurse.`)
  return { data: req, error: null }
}

export const approveNurse = async (id: string) => {
  await delay()
  const idx = mockPendingNurses.findIndex(n => n.id === id)
  if (idx >= 0) {
    const req = mockPendingNurses.splice(idx, 1)[0]
    mockNurses.push({ id: newId(), first_name: req.full_name.split(' ')[0], last_name: req.full_name.split(' ').slice(1).join(' '), username: req.email.split('@')[0], email: req.email, phone: req.phone, department: req.department || 'General', specialization: req.specialization, nursing_license: req.nursing_license || '', experience_years: req.experience_years, status: 'Active' })
  }
  return { data: { success: true }, error: null }
}
export const declineNurse = async (id: string) => {
  await delay()
  const idx = mockPendingNurses.findIndex(n => n.id === id)
  if (idx >= 0) mockPendingNurses.splice(idx, 1)
  return { data: { success: true }, error: null }
}
