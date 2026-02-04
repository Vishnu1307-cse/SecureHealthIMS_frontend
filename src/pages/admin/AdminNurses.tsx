import { useEffect, useState } from 'react'
import { Plus, X, Eye, Check, XCircle, Clock } from 'lucide-react'
import { fetchNurses, addNurse, fetchDepartments, fetchPendingNurses, approveNurse, declineNurse } from '../../services/adminService'
import toast from 'react-hot-toast'

interface Nurse {
  id: string
  first_name: string
  last_name: string
  username: string
  email: string
  phone: string
  department: string
  specialization: string
  nursing_license: string
  experience_years: number
  status: 'Active' | 'Inactive'
}

interface PendingNurse {
  id: string
  full_name: string
  email: string
  phone: string
  department: string
  specialization: string
  nursing_license: string
  experience_years: number
  requested_at: string
}

const emptyForm = {
  first_name: '', last_name: '', username: '', password: '', email: '', phone: '',
  department: '', specialization: '', nursing_license: '', experience_years: 0,
}

export const AdminNurses = () => {
  const [rows, setRows] = useState<Nurse[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingNurse[]>([])
  const [showModal, setShowModal] = useState(false)
  const [viewNurse, setViewNurse] = useState<PendingNurse | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    const { data } = await fetchNurses()
    if (data) setRows(data as Nurse[])
    const { data: depts } = await fetchDepartments()
    if (depts) setDepartments(depts.map((d: { name: string }) => d.name))
    const { data: pending } = await fetchPendingNurses()
    if (pending) setPendingRequests(pending as PendingNurse[])
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.username || !form.department || !form.nursing_license) {
      toast.error('Fill required fields'); return
    }
    const { error } = await addNurse({
      first_name: form.first_name, last_name: form.last_name,
      username: form.username, email: form.email, phone: form.phone,
      department: form.department, specialization: form.specialization,
      nursing_license: form.nursing_license, experience_years: form.experience_years,
    })
    if (error) { toast.error(String(error)); return }
    toast.success('Nurse added successfully')
    toast('📧 Login credentials emailed to ' + (form.email || 'the nurse'), { icon: '✉️', duration: 4000 })
    setShowModal(false)
    setForm(emptyForm)
    load()
  }

  const handleApprove = async (id: string) => {
    const { error } = await approveNurse(id)
    if (!error) {
      toast.success('Nurse request approved')
      load()
    }
  }

  const handleDecline = async (id: string) => {
    const { error } = await declineNurse(id)
    if (!error) {
      toast.success('Nurse request declined')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Nursing Staff</h2>
        <button onClick={() => setShowModal(true)} className="primary-btn flex items-center gap-2">
          <Plus size={16} /> Add New Nurse
        </button>
      </div>

      {/* ── Pending Requests ── */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              Registration Requests ({pendingRequests.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-slate-900/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                    {req.full_name[0]?.toUpperCase() ?? 'N'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{req.full_name}</p>
                    <p className="text-xs text-slate-500">{req.email} · {req.department}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewNurse(req)} className="rounded-md bg-blue-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition flex items-center gap-1">
                    <Eye size={12} /> View
                  </button>
                  <button onClick={() => handleApprove(req.id)} className="rounded-md bg-emerald-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition flex items-center gap-1">
                    <Check size={12} /> Accept
                  </button>
                  <button onClick={() => handleDecline(req.id)} className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition flex items-center gap-1">
                    <XCircle size={12} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Nurse table ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Nurse Name</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Specialization</th>
              <th className="px-5 py-3">License</th>
              <th className="px-5 py-3">Experience</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No nurses found</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700/30 text-xs font-bold text-green-300">
                      {(r.first_name?.[0] ?? 'N').toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-slate-200">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-slate-500">@{r.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-semibold text-green-400 border border-green-500/30">
                    {r.department}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{r.specialization}</td>
                <td className="px-5 py-3 text-slate-400">{r.nursing_license}</td>
                <td className="px-5 py-3 text-slate-200">{r.experience_years} yrs</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${r.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── View pending nurse details modal ── */}
      {viewNurse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewNurse(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Nurse Request Details</h3>
              <button onClick={() => setViewNurse(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Full Name" value={viewNurse.full_name} />
              <Row label="Email" value={viewNurse.email} />
              <Row label="Phone" value={viewNurse.phone} />
              <Row label="Department" value={viewNurse.department} />
              <Row label="Specialization" value={viewNurse.specialization} />
              <Row label="Nursing License" value={viewNurse.nursing_license} />
              <Row label="Experience" value={`${viewNurse.experience_years} years`} />
              <Row label="Requested On" value={viewNurse.requested_at} />
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { handleApprove(viewNurse.id); setViewNurse(null) }} className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 transition">
                Accept
              </button>
              <button onClick={() => { handleDecline(viewNurse.id); setViewNurse(null) }} className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-500 transition">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Nurse modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-green-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Add New Nurse</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-white/80" /></button>
            </div>
            <div className="space-y-5 p-6">
              <h4 className="text-sm font-semibold text-green-400">Login Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" value={form.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} />
                <Field label="Last name" value={form.last_name} onChange={v => setForm(p => ({ ...p, last_name: v }))} />
                <Field label="Username*" value={form.username} onChange={v => setForm(p => ({ ...p, username: v }))} />
                <Field label="Password*" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} />
                <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
                <Field label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
              </div>

              <h4 className="text-sm font-semibold text-green-400">Professional Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Department*</label>
                  <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                    <option value="">----------</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <Field label="Specialization" value={form.specialization} onChange={v => setForm(p => ({ ...p, specialization: v }))} />
                <Field label="Nursing License*" value={form.nursing_license} onChange={v => setForm(p => ({ ...p, nursing_license: v }))} />
                <Field label="Experience (years)" type="number" value={String(form.experience_years)} onChange={v => setForm(p => ({ ...p, experience_years: parseInt(v) || 0 }))} />
              </div>

              <button onClick={save} className="w-full rounded-lg bg-green-600 py-3 font-bold text-white hover:bg-green-500 transition">
                Save Nurse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">{label}</label>
      <input type={type} className="input" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-36 shrink-0 font-medium text-slate-400">{label}:</span>
      <span className="text-slate-200">{value || '—'}</span>
    </div>
  )
}
