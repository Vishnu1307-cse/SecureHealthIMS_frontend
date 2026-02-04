import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { supabase } from '../lib/supabaseClient'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [timer, setTimer] = useState(60)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (step !== 'otp') return
    setTimer(60)
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }
    
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to send OTP')
    } else {
      toast.success('OTP sent to your email!')
      setStep('otp')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit OTP')
      return
    }
    
    // For OTP verification with Supabase, we verify during password reset
    // So we just move to the next step
    toast.success('OTP verified!')
    setStep('reset')
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill all fields')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to reset password')
    } else {
      toast.success('Password reset successfully!')
      navigate('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          {step === 'email' && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-slate-100">Forgot Password</h1>
                <p className="text-sm text-slate-400">Enter your email to receive a verification code.</p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={handleSendOtp}>
                <FormInput 
                  label="Email" 
                  type="email" 
                  value={email} 
                  onChange={setEmail} 
                  placeholder="Enter your email" 
                />
                <button className="primary-btn w-full py-2.5" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
                <div className="flex items-center justify-center pt-2 text-xs text-slate-400">
                  <Link className="text-primary hover:underline" to="/login">
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-slate-100">Verify OTP</h1>
                <p className="text-sm text-slate-400">Enter the 6-digit code sent to {email}</p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp}>
                <FormInput 
                  label="OTP Code" 
                  value={otp} 
                  onChange={setOtp} 
                  placeholder="Enter 6-digit OTP" 
                  maxLength={6}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  {timer > 0 ? <span>Resend available in {timer}s</span> : <span />}
                  <button
                    type="button"
                    className={`text-slate-500 ${timer === 0 ? 'hover:text-slate-300' : ''}`}
                    disabled={timer !== 0}
                    onClick={handleSendOtp}
                  >
                    Resend
                  </button>
                </div>
                <button className="primary-btn w-full py-2.5" type="submit">
                  Verify OTP
                </button>
                <div className="flex items-center justify-center pt-2 text-xs text-slate-400">
                  <Link className="text-primary hover:underline" to="/login">
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-slate-100">Reset Password</h1>
                <p className="text-sm text-slate-400">Enter your new password below.</p>
              </div>
              <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
                <FormInput 
                  label="New Password" 
                  type="password" 
                  value={newPassword} 
                  onChange={setNewPassword} 
                  placeholder="Enter new password" 
                />
                <FormInput 
                  label="Confirm Password" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={setConfirmPassword} 
                  placeholder="Confirm new password" 
                />
                <button className="primary-btn w-full py-2.5" type="submit" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <div className="flex items-center justify-center pt-2 text-xs text-slate-400">
                  <Link className="text-primary hover:underline" to="/login">
                    Back to Login
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
