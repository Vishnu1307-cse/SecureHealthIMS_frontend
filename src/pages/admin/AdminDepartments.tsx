import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { fetchDepartments, addDepartment } from '../../services/adminService'
import toast from 'react-hot-toast'

interface Department {
  id: string
  name: string
  description: string
}

export const AdminDepartments = () => {
  const [rows, setRows] = useState<Department[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = async () => {
    const { data } = await fetchDepartments()
    if (data) setRows(data as Department[])
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    const { error } = await addDepartment(form)
    if (error) { toast.error(String(error)); return }
    toast.success('Department added')
    setShowModal(false)
    setForm({ name: '', description: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Departments</h2>
        <button onClick={() => setShowModal(true)} className="primary-btn flex items-center gap-2">
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Department Name</th>
              <th className="px-5 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.length === 0 && (
              <tr><td colSpan={2} className="px-5 py-10 text-center text-slate-500">No departments found</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 font-medium text-slate-200">{r.name}</td>
                <td className="px-5 py-3 text-slate-400">{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">Add Department</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-white/80" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Department Name*</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                <textarea className="input min-h-[60px] resize-y" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button onClick={save} className="w-full rounded-lg bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 transition">
                Save Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
