import { useEffect, useState } from 'react'
import { Plus, Printer, X } from 'lucide-react'
import { fetchInvoices, addInvoice, fetchServices, fetchPatients } from '../../services/adminService'
import toast from 'react-hot-toast'

interface Invoice {
  id: number
  patient_name: string
  date: string
  total: number
  status: 'Paid' | 'Unpaid'
  services: string[]  // JSON array of service names
}

interface Service {
  id: string
  name: string
  cost: number
  department: string
}

export const AdminBilling = () => {
  const [rows, setRows] = useState<Invoice[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)
  const [form, setForm] = useState({ patient_name: '', selectedServices: [] as string[], status: 'Unpaid' })

  const load = async () => {
    const { data } = await fetchInvoices()
    if (data) setRows(data as Invoice[])
    const { data: svcs } = await fetchServices()
    if (svcs) setServices(svcs as Service[])
    const { data: pts } = await fetchPatients()
    if (pts) setPatients(pts as { id: string; name: string }[])
  }

  useEffect(() => { load() }, [])

  const totalCost = form.selectedServices.reduce((sum, name) => {
    const svc = services.find(s => s.name === name)
    return sum + (svc?.cost ?? 0)
  }, 0)

  const save = async () => {
    if (!form.patient_name || form.selectedServices.length === 0) {
      toast.error('Select patient and at least one service'); return
    }
    const { error } = await addInvoice({
      patient_name: form.patient_name,
      total: totalCost,
      status: form.status,
      services: form.selectedServices,
    })
    if (error) { toast.error(String(error)); return }
    toast.success('Invoice generated successfully!')
    setShowModal(false)
    setForm({ patient_name: '', selectedServices: [], status: 'Unpaid' })
    load()
  }

  const toggleService = (name: string) => {
    setForm(p => ({
      ...p,
      selectedServices: p.selectedServices.includes(name)
        ? p.selectedServices.filter(s => s !== name)
        : [...p.selectedServices, name],
    }))
  }

  const statusColor = (s: string) =>
    s === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    : 'bg-red-500/20 text-red-400 border border-red-500/30'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-100">Billing & Invoices</h2>
        <button onClick={() => setShowModal(true)} className="primary-btn flex items-center gap-2">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Invoice #</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Total (₹)</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No invoices found</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3 font-medium text-slate-300">#{r.id}</td>
                <td className="px-5 py-3 text-slate-300">{r.patient_name}</td>
                <td className="px-5 py-3 text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="px-5 py-3 font-semibold text-slate-200">₹{Number(r.total).toFixed(2)}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setViewInvoice(r)} className="flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-500 transition">
                    <Printer size={13} /> Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* invoice detail / print */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewInvoice(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8" id="invoice-print">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Medos Hospital</h2>
                  <p className="text-xs text-slate-500">42, MG Road, Bengaluru</p>
                  <p className="text-xs text-slate-500">Karnataka, India</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-slate-200">INVOICE #{viewInvoice.id}</h3>
                  <p className="text-xs text-slate-500">Date: {new Date(viewInvoice.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              <hr className="border-slate-700 mb-4" />

              <div className="mb-6">
                <p className="text-xs font-bold text-slate-400 mb-1">Bill To:</p>
                <p className="text-sm font-semibold text-slate-200">{viewInvoice.patient_name}</p>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                    <th className="py-2">Service Description</th>
                    <th className="py-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(viewInvoice.services ?? []).map((s, i) => {
                    const svc = services.find(sv => sv.name === s)
                    return (
                      <tr key={i}>
                        <td className="py-2 text-slate-300">{s}</td>
                        <td className="py-2 text-right text-slate-300">₹{svc ? svc.cost.toFixed(2) : '—'}</td>
                      </tr>
                    )
                  })}
                  <tr className="font-bold">
                    <td className="py-2 text-right text-slate-400">Total:</td>
                    <td className="py-2 text-right text-slate-100">₹{Number(viewInvoice.total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <p className="text-sm text-slate-400"><span className="font-bold">Status:</span> {viewInvoice.status}</p>
            </div>

            <div className="flex gap-3 border-t border-slate-700 px-8 py-4">
              <button onClick={() => window.print()} className="primary-btn flex items-center gap-2">
                <Printer size={16} /> Print Invoice
              </button>
              <button onClick={() => setViewInvoice(null)} className="ghost-btn">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* create invoice modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between rounded-t-2xl bg-slate-800 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-100">Generate New Invoice</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Patient*</label>
                <select className="input" value={form.patient_name} onChange={e => setForm(p => ({ ...p, patient_name: e.target.value }))}>
                  <option value="">----------</option>
                  {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Services*</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={form.selectedServices.includes(s.name)}
                        onChange={() => toggleService(s.name)}
                      />
                      {s.name} – ₹{s.cost.toFixed(2)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Status*</label>
                <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              {form.selectedServices.length > 0 && (
                <p className="text-sm text-slate-400">Total: <span className="font-bold text-white">₹{totalCost.toFixed(2)}</span></p>
              )}
              <button onClick={save} className="w-full rounded-lg bg-slate-700 py-3 font-bold text-white hover:bg-slate-600 transition">
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
