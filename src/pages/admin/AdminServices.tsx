import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { fetchServices, addService, fetchDepartments } from '../../services/adminService'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  department: string
  cost: number
}

export const AdminServices = () => {
  const [rows, setRows] = useState<Service[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', department: '', cost: '0' })

  const load = async () => {
    const { data } = await fetchServices()
    if (data) setRows(data as Service[])
    const { data: depts } = await fetchDepartments()
    if (depts) setDepartments((depts as { name: string }[]).map((d) => d.name))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.department) { toast.error('Fill required fields'); return }
    const { error } = await addService({ name: form.name, department: form.department, cost: parseFloat(form.cost) || 0 })
    if (error) { toast.error(String(error)); return }
    toast.success('Service added')
    setShowModal(false)
    setForm({ name: '', department: '', cost: '0' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Medical Services</h2>
        <button onClick={() => setShowModal(true)} className="primary-btn flex items-center gap-2">
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Service Name</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Cost (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-500">No services found</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 font-medium text-slate-200">{r.name}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
                    {r.department}
                  </span>
                </td>
                <td className="px-5 py-3 font-semibold text-slate-200">₹{Number(r.cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Add Service</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-white/80" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Service Name*</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Department*</label>
                <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                  <option value="">----------</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Cost (₹)*</label>
                <input type="number" className="input" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} />
              </div>
              <button onClick={save} className="w-full rounded-lg bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500 transition">
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
