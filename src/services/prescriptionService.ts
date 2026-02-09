import { supabase } from '../lib/supabaseClient'
import { handleSupabaseError } from './errorHandler'
import { logAudit } from './auditService'

export const createPrescription = async (payload: {
  visit_id: string
  patient_id: string
  created_by: string
  medication_name: string
  dosage: string
  instructions?: string
}) => {
  // SUPABASE TABLE: prescriptions
  // WHY: Doctor creates medication prescription linked to a visit.
  const { data, error } = await supabase.from('prescriptions').insert(payload).select().single()
  handleSupabaseError(error, 'Prescription creation failed')
  if (!error) {
    await logAudit({ action: 'create_prescription', tableName: 'prescriptions', recordId: data?.id, patientId: payload.patient_id })
  }
  return { data, error }
}

export const fetchPatientPrescriptions = async (patientId: string) => {
  // SUPABASE TABLE: prescriptions
  // WHY: Patient/clinician view of medication history.
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  handleSupabaseError(error, 'Prescription history fetch failed')
  if (!error) {
    await logAudit({ action: 'read_prescriptions', tableName: 'prescriptions', patientId })
  }
  return { data, error }
}
