import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Table } from '../components/Table'
import { FormInput } from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { getPatientPrescriptions } from '../services/prescriptionsApiService'
import type { Prescription } from '../services/prescriptionsApiService'

export const PatientPrescriptions = () => {
  const { user, roles } = useAuth()
  const [patientId, setPatientId] = useState('')
  const [items, setItems] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)

  const isPatient = roles.includes('patient')

  const load = async (id: string) => {
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 4000)
    try {
      const { data, error } = await getPatientPrescriptions(id)
      if (!error && data) {
        setItems(data.prescriptions)
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
    <Card title="Patient Prescriptions">
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
        <p className="text-sm text-slate-400">Loading prescriptions...</p>
      ) : (
        <Table
          headers={['Medication', 'Dosage', 'Frequency', 'Duration', 'Doctor']}
          rows={items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.medication_name}</td>
              <td className="px-4 py-3">{item.dosage}</td>
              <td className="px-4 py-3">{item.frequency}</td>
              <td className="px-4 py-3">{item.duration || 'N/A'}</td>
              <td className="px-4 py-3">{item.doctors?.name || 'N/A'}</td>
            </tr>
          ))}
        />
      )}
    </Card>
  )
}
