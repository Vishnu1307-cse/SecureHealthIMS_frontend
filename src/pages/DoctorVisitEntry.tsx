import { useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { createVisit } from '../services/visitsApiService'

export const DoctorVisitEntry = () => {
  const { user } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [findings, setFindings] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    const { error } = await createVisit({
      patient_id: patientId,
      visit_date: visitDate,
      visit_time: visitTime,
      chief_complaint: chiefComplaint,
      findings,
      notes,
    })
    setLoading(false)
    if (!error) {
      toast.success('Visit created')
      setPatientId('')
      setVisitDate('')
      setVisitTime('')
      setChiefComplaint('')
      setFindings('')
      setNotes('')
    }
  }

  return (
    <Card title="Doctor Visit Entry">
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormInput label="Patient ID" value={patientId} onChange={setPatientId} placeholder="UUID" />
        <FormInput label="Visit date" type="date" value={visitDate} onChange={setVisitDate} />
        <FormInput label="Visit time" type="time" value={visitTime} onChange={setVisitTime} />
        <FormInput label="Chief complaint" value={chiefComplaint} onChange={setChiefComplaint} placeholder="Reason for visit" />
        <FormInput label="Findings" value={findings} onChange={setFindings} textarea placeholder="Clinical findings" />
        <FormInput label="Additional notes" value={notes} onChange={setNotes} textarea />
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Create visit'}
        </button>
      </form>
    </Card>
  )
}
