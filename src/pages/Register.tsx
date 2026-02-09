import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { registerUser } from '../services/authService'
import { supabase } from '../lib/supabaseClient'

export const Register = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'patient' | 'doctor' | 'nurse'>('patient')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [step, setStep] = useState<'form' | 'email'>('form')
  const [emailTimer, setEmailTimer] = useState(50)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (step !== 'email') return
    setEmailTimer(50)
    const interval = setInterval(() => {
      setEmailTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword || !fullName || !role || !dateOfBirth || !gender || !phone || !address) {
      toast.error('Registration failed: Please fill all fields')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Registration failed: Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Registration failed: Password must be at least 6 characters')
      return
    }

    // Step 1: Register the user with Supabase (sends confirmation OTP email automatically)
    setLoading(true)
    const payload = {
      email,
      password,
      name: fullName,
      role,
      date_of_birth: dateOfBirth,
      gender,
      phone,
      address,
    }
    const { error } = await registerUser(payload)
    setLoading(false)

    if (error) {
      return // registerUser already shows toast via handleSupabaseError
    }

    toast.success('A 6-digit OTP has been sent to your email!')
    setStep('email')
  }

  const onResendOtp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to resend OTP')
    } else {
      toast.success('OTP resent to your email!')
      setEmailTimer(50)
    }
  }

  const onVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (emailOtp.trim().length < 6) {
      toast.error('Verification failed: Enter the 6-digit OTP')
      return
    }

    // Step 2: Verify the OTP with Supabase
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: emailOtp.trim(),
      type: 'signup',
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Invalid or expired OTP')
      return
    }

    if (role === 'patient') {
      toast.success('Email verified! Registration complete.')
    } else {
      toast.success('Email verified! Registration request sent to Admin for approval.')
    }
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          {step === 'form' && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-100">Register</h1>
                <p className="text-sm text-slate-400">Create your account in seconds.</p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="Email" />
                <FormInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Password" />
                <FormInput
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm Password"
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Role</label>
                  <select
                    className="input"
                    value={role}
                    onChange={(event) => setRole(event.target.value as 'patient' | 'doctor' | 'nurse')}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </div>
                <FormInput label="Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
                <FormInput
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  placeholder="1990-01-01"
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Gender</label>
                  <select className="input" value={gender} onChange={(event) => setGender(event.target.value)}>
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <FormInput label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Address</label>
                  <textarea
                    className="input min-h-[70px]"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="42, MG Road, Bengaluru, Karnataka"
                  />
                </div>
                <button className="primary-btn w-full py-2.5" type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
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
                  <span>Already have an account?</span>
                  <Link
                    className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-primary transition"
                    to="/login"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === 'email' && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-100">Email Verification</h1>
                <p className="text-sm text-slate-400">Enter the 6-digit code sent to {email}.</p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={onVerifyEmail}>
                <FormInput label="Email OTP" value={emailOtp} onChange={setEmailOtp} placeholder="Enter 6-digit OTP" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  {emailTimer > 0 ? <span>Resend available in {emailTimer}s</span> : <span />}
                  <button
                    type="button"
                    className={`text-slate-500 ${emailTimer === 0 ? 'hover:text-slate-300' : ''}`}
                    disabled={emailTimer !== 0 || loading}
                    onClick={onResendOtp}
                  >
                    Resend
                  </button>
                </div>
                <button className="primary-btn w-full py-2.5" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                  <span>Already have an account?</span>
                  <Link
                    className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-primary transition"
                    to="/login"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
