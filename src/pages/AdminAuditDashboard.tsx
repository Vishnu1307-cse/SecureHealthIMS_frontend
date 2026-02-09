import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Table } from '../components/Table'
import { FormInput } from '../components/FormInput'
import { getAllAuditLogs } from '../services/auditApiService'
import type { AuditLog } from '../services/auditApiService'

export const AdminAuditDashboard = () => {
  const [action, setAction] = useState('')
  const [resource, setResource] = useState('')
  const [userId, setUserId] = useState('')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    const params: any = { limit: 100 }
    if (action) params.action = action
    if (resource) params.resource = resource
    if (userId) params.user_id = userId

    const { data, error } = await getAllAuditLogs(params)

    if (!error && data) {
      setLogs(data.logs)
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <Card title="Audit Filters">
        <div className="grid gap-4 md:grid-cols-3">
          <FormInput label="Action" value={action} onChange={setAction} placeholder="READ, CREATE, UPDATE, DELETE" />
          <FormInput label="Resource" value={resource} onChange={setResource} placeholder="medical_records, appointments" />
          <FormInput label="User ID" value={userId} onChange={setUserId} placeholder="UUID" />
        </div>
        <div className="mt-4">
          <button className="primary-btn" onClick={load}>
            Apply filters
          </button>
        </div>
      </Card>

      <Card title="Audit Logs">
        {loading ? (
          <p className="text-sm text-slate-400">Loading logs...</p>
        ) : (
          <Table
            headers={['Action', 'Resource', 'Record ID', 'User ID', 'Time']}
            rows={logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">{log.resource}</td>
                <td className="px-4 py-3">{log.resource_id || 'N/A'}</td>
                <td className="px-4 py-3">{log.user_id || 'N/A'}</td>
                <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          />
        )}
      </Card>
    </div>
  )
}
