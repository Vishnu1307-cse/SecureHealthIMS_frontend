import { supabase } from '../lib/supabaseClient'
import { handleSupabaseError } from './errorHandler'
import { logAudit } from './auditService'

export const createVisit = async (payload: {
  patient_id: string
  created_by: string
  visit_date: string
  notes?: string
}) => {
  // SUPABASE TABLE: visits
  // WHY: Doctor creates a clinical visit record.
  const { data, error } = await supabase.from('visits').insert(payload).select().single()
  handleSupabaseError(error, 'Visit creation failed')
  if (!error) {
    await logAudit({ action: 'create_visit', tableName: 'visits', recordId: data?.id, patientId: payload.patient_id })
  }
  return { data, error }
}

export const fetchPatientHistory = async (patientId: string) => {
  // SUPABASE TABLE: visits
  // WHY: Fetch chronological visit history for patient overview.
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false })
  handleSupabaseError(error, 'Visit history fetch failed')
  if (!error) {
    await logAudit({ action: 'read_visits', tableName: 'visits', patientId })
  }
  return { data, error }
}
