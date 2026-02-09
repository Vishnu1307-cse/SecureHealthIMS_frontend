import { useAuth } from '../context/AuthContext'
import { Construction, Stethoscope, HeartPulse } from 'lucide-react'

export const ComingSoon = () => {
  const { roles, profile, user } = useAuth()
  const role = roles[0] || 'user'
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split('@')[0] ||
    'there'

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  const Icon = role === 'doctor' ? Stethoscope : HeartPulse

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Icon size={48} className="text-primary" />
        </div>
        <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
          <Construction size={20} className="text-amber-400" />
        </span>
      </div>

      <h1 className="text-3xl font-bold text-slate-100">
        Welcome, <span className="text-primary">{displayName}</span>
      </h1>

      <p className="mt-2 text-lg text-slate-400">
        {roleLabel} Dashboard
      </p>

      <div className="mt-8 max-w-md space-y-3">
        <p className="text-sm leading-relaxed text-slate-400">
          We're working hard to bring you a powerful {roleLabel.toLowerCase()} experience. 
          Your dedicated dashboard with clinical tools, patient management, and 
          workflow features is currently under development.
        </p>

        <div className="rounded-xl border border-slate-800/60 bg-white/[0.03] px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Coming Soon</p>
          <p className="mt-1 text-sm text-slate-400">
            Stay tuned — exciting features are on the way!
          </p>
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <a href="/profile" className="primary-btn text-sm">View Profile</a>
        <button onClick={() => window.location.reload()} className="ghost-btn text-sm">Refresh</button>
      </div>
    </div>
  )
}
