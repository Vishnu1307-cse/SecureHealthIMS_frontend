import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = () => {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-sm text-slate-400">Loading…</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
