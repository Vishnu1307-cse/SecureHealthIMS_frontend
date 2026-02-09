import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { loginUser } from '../services/authService'
import { ensureUserProfile } from '../services/userService'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Enter email and password'); return }
    setLoading(true)

    try {
      const { data, error } = await loginUser(email, password)

      if (error || !data?.user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await ensureUserProfile(data.user)
      const role = profileData?.role || 'patient'
      const profileCompleted = profileData?.profile_completed ?? false
      setLoading(false)
      toast.success('Logged in successfully')

      if (!profileCompleted) {
        navigate('/profile-setup', { replace: true })
        return
      }

      switch (role) {
        case 'admin':  navigate('/admin/dashboard', { replace: true }); break
        case 'doctor': navigate('/doctor/visits', { replace: true }); break
        case 'nurse':  navigate('/nurse/patients', { replace: true }); break
        default:       navigate('/consent', { replace: true })
      }
    } catch {
      toast.error('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-slate-100">Login</h1>
            <p className="text-sm text-slate-400">If you already a member, easily log in now.</p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="Email" />
            <FormInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Password" />
            <button className="primary-btn w-full py-2.5" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="my-3 flex items-center gap-3 text-xs text-slate-500">
              <div className="h-px flex-1 bg-slate-800" />
              OR
              <div className="h-px flex-1 bg-slate-800" />
            </div>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/60 transition"
            >
              Login with Google
            </button>
            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forget password?
              </Link>
              <div className="flex items-center gap-2">
                <span>If you don't have an account.</span>
                <Link
                  className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-primary transition"
                  to="/register"
                >
                  Register
                </Link>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
