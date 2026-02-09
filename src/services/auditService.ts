import { supabase } from '../lib/supabaseClient'

export const logAudit = async (params: {
  action: string
  tableName: string
  recordId?: string
  patientId?: string
}) => {
  // SUPABASE TABLE: audit_logs
  // WHY: Ensure every read/write is captured for compliance and transparency.
  try {
    const { error } = await supabase.from('audit_logs').insert({
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId ?? null,
      patient_id: params.patientId ?? null,
    })

    if (error) {
      console.warn('Audit logging failed:', error.message)
    }
  } catch (error) {
    console.warn('Audit logging failed:', error)
  }
}
