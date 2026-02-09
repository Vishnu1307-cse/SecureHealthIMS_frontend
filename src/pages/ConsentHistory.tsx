import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { getConsentHistory } from '../services/consentApiService'
import type { ConsentHistory as ConsentHistoryType } from '../services/consentApiService'

export const ConsentHistory = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState<ConsentHistoryType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      const { data, error } = await getConsentHistory()
      if (!error && data) {
        setHistory(data.history)
      }
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <Card title="Consent History">
      {loading ? (
        <p className="text-sm text-slate-400">Loading history...</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-1 h-3 w-3 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {item.consent_type}: {item.previous_status || 'none'} → {item.new_status}
                </p>
                <p className="text-xs text-slate-400">{new Date(item.changed_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!history.length && <p className="text-sm text-slate-400">No history available.</p>}
        </div>
      )}
    </Card>
  )
}
