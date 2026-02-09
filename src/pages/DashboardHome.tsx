import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const DashboardHome = () => {
  const { roles } = useAuth()
  const navigate = useNavigate()
  const role = roles[0] || 'patient'

  // Redirect to role-specific dashboard on mount / reload
  useEffect(() => {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true })
        break
      case 'doctor':
      case 'nurse':
        navigate('/coming-soon', { replace: true })
        break
      default:
        navigate('/consent', { replace: true })
    }
  }, [role, navigate])

  return null
}
