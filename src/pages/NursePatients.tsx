import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Table } from '../components/Table'
import { getAllPatients } from '../services/patientsApiService'
import type { Patient } from '../services/patientsApiService'

export const NursePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await getAllPatients()
      if (!error && data) {
        setPatients(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Card title="Patient Directory">
      {loading ? (
        <p className="text-sm text-slate-400">Loading patients...</p>
      ) : (
        <Table
          headers={['Name', 'DOB', 'Gender', 'Phone']}
          rows={patients.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">{p.name || 'N/A'}</td>
              <td className="px-4 py-3">{p.dob ? new Date(p.dob).toLocaleDateString() : 'N/A'}</td>
              <td className="px-4 py-3">{p.gender || 'N/A'}</td>
              <td className="px-4 py-3">{p.phone || 'N/A'}</td>
            </tr>
          ))}
        />
      )}
    </Card>
  )
}
