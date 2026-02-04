import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { fetchLabTests, addLabTest, fetchPatients } from '../../services/adminService'
import toast from 'react-hot-toast'

interface LabTest {
  id: string
  date: string
  patient_name: string
  test_name: string
  description: string
  result: string
  cost: number
  conducted_by: string
}

const emptyForm = { patient_name: '', test_name: '', description: '', result: '', cost: '0' }

export const AdminLaboratory = () => {
  const [rows, setRows] = useState<LabTest[]>([])
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    const { data } = await fetchLabTests()
    if (data) setRows(data as LabTest[])
    const { data: pts } = await fetchPatients()
    if (pts) setPatients(pts as { id: string; name: string }[])
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.patient_name || !form.test_name || !form.result) {
      toast.error('Fill required fields'); return
    }
    const { error } = await addLabTest({
      patient_name: form.patient_name,
      test_name: form.test_name,
      description: form.description,
      result: form.result,
      cost: parseFloat(form.cost) || 0,
      date: new Date().toISOString().slice(0, 10),
      conducted_by: 'admin',
    })
    if (error) { toast.error(String(error)); return }
    toast.success('Lab test result recorded successfully!')
    setShowModal(false)
    setForm(emptyForm)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Laboratory Reports</h2>
        <button onClick={() => setShowModal(true)} className="primary-btn flex items-center gap-2">
          <Plus size={16} /> Add New Result
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Test Name</th>
              <th className="px-5 py-3">Result Summary</th>
              <th className="px-5 py-3">Cost</th>
              <th className="px-5 py-3">Conducted By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No lab reports found</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 text-slate-400">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="px-5 py-3 text-slate-300">{r.patient_name}</td>
                <td className="px-5 py-3 font-semibold text-slate-200">{r.test_name}</td>
                <td className="px-5 py-3 text-slate-400">{r.result}</td>
                <td className="px-5 py-3 font-semibold text-slate-200">₹{Number(r.cost).toFixed(2)}</td>
                <td className="px-5 py-3 text-slate-400">{r.conducted_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-red-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">🧪 Record New Lab Test</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-white/80" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Patient*</label>
                  <select className="input" value={form.patient_name} onChange={e => setForm(p => ({ ...p, patient_name: e.target.value }))}>
                    <option value="">----------</option>
                    {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <Field label="Test name*" value={form.test_name} onChange={v => setForm(p => ({ ...p, test_name: v }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                <textarea className="input min-h-[60px] resize-y" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Result*</label>
                <textarea className="input min-h-[60px] resize-y" value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))} />
              </div>
              <Field label="Cost*" type="number" value={form.cost} onChange={v => setForm(p => ({ ...p, cost: v }))} />
              <button onClick={save} className="w-full rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-500 transition">
                Save Result
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
