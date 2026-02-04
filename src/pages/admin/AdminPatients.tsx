import { useEffect, useState } from 'react'
import { Search, Eye, X } from 'lucide-react'
import { fetchPatients, addPatient } from '../../services/adminService'
import toast from 'react-hot-toast'

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  email: string
  blood_group: string
  address: string
  medical_history: string
}

const emptyForm = { name: '', age: '', gender: '', phone: '', email: '', blood_group: '', address: '', medical_history: '' }

export const AdminPatients = () => {
  const [rows, setRows] = useState<Patient[]>([])
  const [showModal, setShowModal] = useState(false)
  const [viewPatient, setViewPatient] = useState<Patient | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await fetchPatients()
    if (data) setRows(data as Patient[])
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.phone || !form.age || !form.gender) {
      toast.error('Fill all required fields'); return
    }
    const { error } = await addPatient({
      name: form.name, age: parseInt(form.age), gender: form.gender,
      phone: form.phone, email: form.email, blood_group: form.blood_group,
      address: form.address, medical_history: form.medical_history,
    })
    if (error) { toast.error(String(error)); return }
    toast.success('Patient registered successfully')
    setShowModal(false)
    setForm(emptyForm)
    load()
  }

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search)
  )

  const bloodGroupColor = (bg: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-red-400', 'A-': 'text-red-300', 'B+': 'text-orange-400', 'B-': 'text-orange-300',
      'AB+': 'text-violet-400', 'AB-': 'text-violet-300', 'O+': 'text-red-500', 'O-': 'text-red-400',
    }
    return colors[bg] ?? 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Patients List</h2>
      </div>

      {/* search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input pl-10" placeholder="Search by Name or Phone…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Age / Gender</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Blood Group</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No patients found</td></tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 font-medium text-slate-200">{r.name}</td>
                <td className="px-5 py-3 text-slate-400">{r.age} / {r.gender}</td>
                <td className="px-5 py-3 text-slate-400">{r.phone}</td>
                <td className="px-5 py-3">
                  <span className={`text-lg font-bold ${bloodGroupColor(r.blood_group)}`}>🅾 {r.blood_group || '—'}</span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setViewPatient(r)} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition">
                    <Eye size={13} className="inline mr-1" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* view modal */}
      {viewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewPatient(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Patient Details</h3>
              <button onClick={() => setViewPatient(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Name" value={viewPatient.name} />
              <Row label="Age / Gender" value={`${viewPatient.age} / ${viewPatient.gender}`} />
              <Row label="Phone" value={viewPatient.phone} />
              <Row label="Email" value={viewPatient.email} />
              <Row label="Blood Group" value={viewPatient.blood_group} />
              <Row label="Address" value={viewPatient.address} />
              <Row label="Medical History" value={viewPatient.medical_history} />
            </div>
          </div>
        </div>
      )}

      {/* add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Register New Patient</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-white/80" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Name*" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                <Field label="Age*" type="number" value={form.age} onChange={v => setForm(p => ({ ...p, age: v }))} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Gender*</label>
                  <select className="input" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                    <option value="">----------</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone*" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                <Field label="Blood group" value={form.blood_group} onChange={v => setForm(p => ({ ...p, blood_group: v }))} />
              </div>
              <Field label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Address*</label>
                <textarea className="input min-h-[60px] resize-y" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Medical history</label>
                <textarea className="input min-h-[60px] resize-y" value={form.medical_history} onChange={e => setForm(p => ({ ...p, medical_history: e.target.value }))} />
              </div>
              <button onClick={save} className="w-full rounded-lg bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500 transition">
                Save Patient
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
