import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Table } from '../components/Table'
import { FormInput } from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { getPatientVisits } from '../services/visitsApiService'
import type { Visit } from '../services/visitsApiService'

export const PatientHistory = () => {
  const { user, roles } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)

  const isPatient = roles.includes('patient')

  const load = async (id: string) => {
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 4000)
    try {
      const { data, error } = await getPatientVisits(id)
      if (!error && data) {
        setVisits(data.visits)
      }
    } catch { /* backend unreachable */ }
    clearTimeout(timeout)
    setLoading(false)
  }

  useEffect(() => {
    if (isPatient && user?.id) {
      load(user.id)
    }
  }, [isPatient, user])

  const onSearch = async () => {
    if (!patientId) return
    await load(patientId)
  }

  return (
    <Card title="Patient History">
      {!isPatient && (
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <FormInput label="Patient ID" value={patientId} onChange={setPatientId} />
          </div>
          <div className="mt-6">
            <button className="primary-btn" onClick={onSearch}>
              Search
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-slate-400">Loading visits...</p>
      ) : (
        <Table
          headers={['Visit Date', 'Time', 'Chief Complaint', 'Findings', 'Doctor']}
          rows={visits.map((visit) => (
            <tr key={visit.id}>
              <td className="px-4 py-3">{new Date(visit.visit_date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{visit.visit_time}</td>
              <td className="px-4 py-3">{visit.chief_complaint || 'N/A'}</td>
              <td className="px-4 py-3">{visit.findings || 'N/A'}</td>
              <td className="px-4 py-3">{visit.doctors?.name || 'N/A'}</td>
            </tr>
          ))}
        />
      )}
    </Card>
  )
}
