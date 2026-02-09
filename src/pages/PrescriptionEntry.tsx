import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { createPrescription } from '../services/prescriptionsApiService'

export const PrescriptionEntry = () => {
  const { user } = useAuth()
  const [visitId, setVisitId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [medicationName, setMedicationName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    const { error } = await createPrescription({
      patient_id: patientId,
      visit_id: visitId || undefined,
      medication_name: medicationName,
      dosage,
      frequency,
      duration: duration || undefined,
      notes: notes || undefined,
    })
    setLoading(false)
    if (!error) {
      toast.success('Prescription created')
      setVisitId('')
      setPatientId('')
      setMedicationName('')
      setDosage('')
      setFrequency('')
      setDuration('')
      setNotes('')
    }
  }

  return (
    <Card title="Prescription Entry">
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormInput label="Patient ID" value={patientId} onChange={setPatientId} placeholder="UUID (required)" />
        <FormInput label="Visit ID (optional)" value={visitId} onChange={setVisitId} placeholder="UUID" />
        <FormInput label="Medication" value={medicationName} onChange={setMedicationName} placeholder="Name of medication" />
        <FormInput label="Dosage" value={dosage} onChange={setDosage} placeholder="e.g., 500mg" />
        <FormInput label="Frequency" value={frequency} onChange={setFrequency} placeholder="e.g., twice daily" />
        <FormInput label="Duration (optional)" value={duration} onChange={setDuration} placeholder="e.g., 7 days" />
        <FormInput label="Notes (optional)" value={notes} onChange={setNotes} textarea placeholder="Additional instructions" />
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create prescription'}
        </button>
      </form>
    </Card>
  )
}
