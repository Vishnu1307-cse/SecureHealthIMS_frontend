import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, X } from 'lucide-react'
import { fetchAppointments, addAppointment, updateAppointment } from '../../services/adminService'
import toast from 'react-hot-toast'

interface Appointment {
  id: string
  date: string
  time: string
  patient_name: string
  doctor_name: string
  reason: string
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'
}

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  Confirmed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  Completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const emptyForm = { patient_name: '', doctor_name: '', date: '', time: '', reason: '', status: 'Pending' as string }

export const AdminAppointments = () => {
  const [rows, setRows] = useState<Appointment[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await fetchAppointments()
    if (data) setRows(data as Appointment[])
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true) }
  const openEdit = (r: Appointment) => {
    setForm({ patient_name: r.patient_name, doctor_name: r.doctor_name, date: r.date, time: r.time, reason: r.reason, status: r.status })
    setEditId(r.id)
    setShowModal(true)
  }

  const save = async () => {
    if (!form.patient_name || !form.doctor_name || !form.date || !form.time) {
      toast.error('Fill all required fields'); return
    }
    if (editId) {
      const { error } = await updateAppointment(editId, form)
      if (error) { toast.error(String(error)); return }
      toast.success('Appointment updated')
    } else {
      const { error } = await addAppointment(form)
      if (error) { toast.error(String(error)); return }
      toast.success('Appointment booked & Confirmation Email sent!')
    }
    setShowModal(false)
    load()
  }

  const filtered = rows.filter(r =>
    r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Appointments</h2>
        <button onClick={openNew} className="primary-btn flex items-center gap-2">
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-10"
          placeholder="Search by patient or doctor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Date / Time</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Doctor</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No appointments found</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 whitespace-nowrap">
                  <p className="font-medium text-slate-200">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-slate-500">{r.time}</p>
                </td>
                <td className="px-5 py-3 text-slate-300">{r.patient_name}</td>
                <td className="px-5 py-3 text-slate-300">{r.doctor_name}</td>
                <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate">{r.reason}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${statusColors[r.status] ?? ''}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => openEdit(r)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Edit2 size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-amber-500 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">📅 {editId ? 'Edit Appointment' : 'Book Appointment'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-800" /></button>
            </div>
            <div className="space-y-4 p-6">
              <Field label="Patient*" value={form.patient_name} onChange={v => setForm(p => ({ ...p, patient_name: v }))} />
              <Field label="Doctor*" value={form.doctor_name} onChange={v => setForm(p => ({ ...p, doctor_name: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date*" type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} />
                <Field label="Time*" type="time" value={form.time} onChange={v => setForm(p => ({ ...p, time: v }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Reason</label>
                <textarea className="input min-h-[80px] resize-y" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
              {editId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <button onClick={save} className="w-full rounded-lg bg-amber-500 py-3 font-bold text-slate-900 hover:bg-amber-400 transition">
                {editId ? 'Update Appointment' : 'Confirm Booking'}
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
