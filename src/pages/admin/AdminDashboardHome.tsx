import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  CalendarPlus, HeartPulse, Stethoscope, FlaskConical, CalendarDays, Users,
  FileText, BarChart3,
} from 'lucide-react'
import { fetchStats } from '../../services/adminService'

/* ── mock chart data (replace with real queries later) ── */
const trafficData = [
  { month: 'Jan', visits: 12 }, { month: 'Feb', visits: 18 },
  { month: 'Mar', visits: 14 }, { month: 'Apr', visits: 16 },
  { month: 'May', visits: 20 }, { month: 'Jun', visits: 15 },
  { month: 'Jul', visits: 22 }, { month: 'Aug', visits: 19 },
  { month: 'Sep', visits: 17 }, { month: 'Oct', visits: 24 },
  { month: 'Nov', visits: 21 }, { month: 'Dec', visits: 26 },
]

const demographicData = [
  { name: 'Doctors', value: 35, color: '#3B82F6' },
  { name: 'Patients', value: 45, color: '#22C55E' },
  { name: 'Staff', value: 20, color: '#F59E0B' },
]

const quickActions = [
  { label: 'BOOK APPOINTMENT', icon: CalendarPlus, color: 'bg-amber-400 text-amber-900', to: '/admin/appointments?new=1' },
  { label: 'ADD NURSE', icon: HeartPulse, color: 'bg-green-500 text-white', to: '/admin/nurses?new=1' },
  { label: 'ADD DOCTOR', icon: Stethoscope, color: 'bg-violet-500 text-white', to: '/admin/doctors?new=1' },
  { label: 'LABORATORY', icon: FlaskConical, color: 'bg-red-500 text-white', to: '/admin/laboratory' },
  { label: 'ALL APPOINTMENTS', icon: CalendarDays, color: 'bg-cyan-500 text-white', to: '/admin/appointments' },
  { label: 'PATIENT LIST', icon: Users, color: 'bg-teal-400 text-teal-900', to: '/admin/patients' },
  { label: 'INVOICES', icon: FileText, color: 'bg-slate-600 text-white', to: '/admin/billing' },
  { label: 'REPORTS', icon: BarChart3, color: 'bg-orange-500 text-white', to: '/admin/reports' },
]

export const AdminDashboardHome = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, income: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchStats()
        if (data) setStats(data)
      } catch { /* use defaults */ }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      {/* ── stat cards ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="DOCTORS" value={stats.doctors} bg="bg-blue-600" icon="👨‍⚕️" />
        <StatCard label="PATIENTS" value={stats.patients} bg="bg-emerald-600" icon="🏥" />
        <StatCard label="APPOINTMENTS" value={stats.appointments} bg="bg-amber-500" icon="📋" />
        <StatCard label="INCOME" value={`₹${stats.income.toLocaleString()}`} bg="bg-red-600" icon="💰" />
      </div>

      {/* ── quick actions ── */}
      <div>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="group flex flex-col items-center gap-3 rounded-xl bg-white/[0.04] border border-slate-800/60 p-5
                         hover:bg-white/[0.08] hover:border-primary/40 transition-all"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-full ${a.color} shadow-lg
                               group-hover:scale-110 transition-transform`}>
                <a.icon size={24} />
              </span>
              <span className="text-[11px] font-bold tracking-wider text-slate-300 group-hover:text-white">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── charts ── */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl bg-white/[0.04] border border-slate-800/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-emerald-400">Hospital Traffic (Monthly)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#E2E8F0' }}
              />
              <Area type="monotone" dataKey="visits" stroke="#3B82F6" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-xl bg-white/[0.04] border border-slate-800/60 p-5">
          <h3 className="mb-4 text-sm font-semibold text-violet-400">Patient Demographics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={demographicData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" paddingAngle={4}>
                {demographicData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => <span className="text-xs text-slate-300">{value}</span>}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9' }}
                itemStyle={{ color: '#F1F5F9' }}
                labelStyle={{ color: '#94A3B8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ── stat card ── */
function StatCard({ label, value, bg, icon }: { label: string; value: string | number; bg: string; icon: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${bg} p-5 text-white shadow-lg`}>
      <p className="text-xs font-bold tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      <span className="absolute -bottom-2 -right-2 text-5xl opacity-20">{icon}</span>
    </div>
  )
}
