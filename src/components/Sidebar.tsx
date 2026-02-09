import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, CalendarDays, Stethoscope, Users, CreditCard,
  FlaskConical, BarChart3, Building2, Briefcase, Shield, FileText,
  Heart, ClipboardList, Eye, UserCog, HeartPulse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem { label: string; to: string; icon: LucideIcon }
interface NavGroup { heading: string; items: NavItem[] }

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-primary/15 text-primary'
      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
  }`

export const Sidebar = () => {
  const { roles } = useAuth()
  const role = roles[0] || 'patient'

  const adminGroups: NavGroup[] = [
    {
      heading: 'MAIN',
      items: [
        { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Appointments', to: '/admin/appointments', icon: CalendarDays },
      ],
    },
    {
      heading: 'PEOPLE',
      items: [
        { label: 'Doctors', to: '/admin/doctors', icon: Stethoscope },
        { label: 'Nurses', to: '/admin/nurses', icon: HeartPulse },
        { label: 'Patients', to: '/admin/patients', icon: Users },
      ],
    },
    {
      heading: 'FINANCE & MEDICAL',
      items: [
        { label: 'Billing', to: '/admin/billing', icon: CreditCard },
        { label: 'Laboratory', to: '/admin/laboratory', icon: FlaskConical },
        { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      heading: 'ADMIN',
      items: [
        { label: 'Departments', to: '/admin/departments', icon: Building2 },
        { label: 'Services', to: '/admin/services', icon: Briefcase },
        { label: 'Roles', to: '/admin/roles', icon: Shield },
        { label: 'Audit Logs', to: '/admin/audit-logs', icon: FileText },
      ],
    },
  ]

  const otherGroups: Record<string, NavGroup[]> = {
    patient: [
      {
        heading: 'MAIN',
        items: [
          { label: 'Consent', to: '/consent', icon: Heart },
          { label: 'History', to: '/history', icon: ClipboardList },
          { label: 'Prescriptions', to: '/prescriptions', icon: FileText },
          { label: 'Access Logs', to: '/access-logs', icon: Eye },
        ],
      },
      { heading: 'ACCOUNT', items: [{ label: 'Profile', to: '/profile', icon: UserCog }] },
    ],
    doctor: [
      {
        heading: 'MAIN',
        items: [
          { label: 'Dashboard', to: '/coming-soon', icon: LayoutDashboard },
        ],
      },
      {
        heading: 'CLINICAL',
        items: [
          { label: 'Visits', to: '/doctor/visits', icon: ClipboardList },
          { label: 'Prescriptions', to: '/doctor/prescriptions', icon: FileText },
        ],
      },
      { heading: 'ACCOUNT', items: [{ label: 'Profile', to: '/profile', icon: UserCog }] },
    ],
    nurse: [
      {
        heading: 'MAIN',
        items: [
          { label: 'Dashboard', to: '/coming-soon', icon: LayoutDashboard },
        ],
      },
      {
        heading: 'CLINICAL',
        items: [{ label: 'Patients', to: '/nurse/patients', icon: Users }],
      },
      { heading: 'ACCOUNT', items: [{ label: 'Profile', to: '/profile', icon: UserCog }] },
    ],
  }

  const groups = role === 'admin' ? adminGroups : otherGroups[role] ?? []

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800/70 bg-slate-950/80 px-5 py-6 backdrop-blur md:flex">
      {/* logo */}
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-lg">💊</span>
        <div>
          <h1 className="text-base font-bold leading-tight text-slate-100">Medos</h1>
          <p className="text-[10px] font-semibold tracking-wider text-slate-500">HOSPITAL</p>
        </div>
      </div>

      {/* nav groups */}
      <nav className="flex-1 space-y-6">
        {groups.map(g => (
          <div key={g.heading}>
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">{g.heading}</p>
            <div className="space-y-1">
              {g.items.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
