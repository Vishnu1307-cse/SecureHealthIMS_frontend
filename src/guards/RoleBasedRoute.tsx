import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

export const RoleBasedRoute = ({ allowedRoles }: { allowedRoles: Role[] }) => {
  const { roles, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-sm text-slate-400">Loading…</div>
      </div>
    )
  }

  const isAllowed = roles.some((role) => allowedRoles.includes(role))

  if (!isAllowed) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
