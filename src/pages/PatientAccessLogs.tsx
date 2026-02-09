import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { Table } from '../components/Table'
import { useAuth } from '../context/AuthContext'
import { getMyAuditLogs } from '../services/auditApiService'
import type { AuditLog } from '../services/auditApiService'

export const PatientAccessLogs = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return }
      setLoading(true)
      const timeout = setTimeout(() => setLoading(false), 4000)
      try {
        const { data, error } = await getMyAuditLogs({ limit: 50 })
        if (!error && data) {
          setLogs(data.logs)
        }
      } catch { /* backend unreachable */ }
      clearTimeout(timeout)
      setLoading(false)
    }

    load()
  }, [user])

  return (
    <Card title="My Access Logs">
      {loading ? (
        <p className="text-sm text-slate-400">Loading logs...</p>
      ) : (
        <Table
          headers={['Action', 'Resource', 'Record ID', 'Time']}
          rows={logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3">{log.action}</td>
              <td className="px-4 py-3">{log.resource}</td>
              <td className="px-4 py-3">{log.resource_id || 'N/A'}</td>
              <td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        />
      )}
    </Card>
  )
}
