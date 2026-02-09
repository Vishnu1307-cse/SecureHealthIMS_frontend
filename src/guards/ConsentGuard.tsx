import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchConsent } from '../services/consentService'

export const ConsentGuard = () => {
  const { user, roles } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasConsent, setHasConsent] = useState(true)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    const load = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      // Only enforce consent for patient role.
      if (!roles.includes('patient')) {
        setHasConsent(true)
        setLoading(false)
        return
      }

      // Auto-stop after 4s so the page never hangs
      timeout = setTimeout(() => setLoading(false), 4000)

      try {
        const { data } = await fetchConsent(user.id)
        setHasConsent(!!data?.has_consented)
      } catch {
        // If backend unreachable, don't block the UI
        setHasConsent(true)
      }
      setLoading(false)
    }

    load()
    return () => clearTimeout(timeout)
  }, [user, roles])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="animate-pulse text-sm text-slate-400">Loading…</div>
      </div>
    )
  }

  if (!hasConsent) {
    return <Navigate to="/consent" replace />
  }

  return <Outlet />
}
