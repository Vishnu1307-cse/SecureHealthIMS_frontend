import { useState } from 'react'
import { fetchReports } from '../../services/adminService'

interface InvoiceRow {
  date: string
  patient_name: string
  total: number
}

export const AdminReports = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!startDate || !endDate) return
    setSearched(true)

    const { data } = await fetchReports(startDate, endDate)
    if (data) {
      const invData = (data.invoices ?? []) as InvoiceRow[]
      setInvoices(invData)
      setTotalIncome(invData.reduce((s, r) => s + Number(r.total), 0))
      setTotalAppointments(data.totalAppointments ?? 0)
    }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-100">📊 Generate Reports</h2>

      {/* filter bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-800/60 bg-white/[0.03] p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Start Date</label>
          <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">End Date</label>
          <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={search} className="primary-btn h-[42px]">Search Records</button>
      </div>

      {searched && (
        <>
          {/* summary cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-900/30 border border-emerald-600/30 p-6 text-center">
              <p className="text-sm font-semibold text-emerald-400">Total Income</p>
              <p className="mt-1 text-3xl font-extrabold text-white">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-amber-900/30 border border-amber-600/30 p-6 text-center">
              <p className="text-sm font-semibold text-amber-400">Total Appointments</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{totalAppointments}</p>
            </div>
          </div>

          {/* date banner */}
          <div className="rounded-lg bg-slate-800 px-5 py-2 text-sm text-slate-300">
            Report: {fmtDate(startDate)} to {fmtDate(endDate)}
          </div>

          {/* detailed invoices */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-200">Detailed Invoices</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800/60 bg-white/[0.03]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {invoices.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-slate-500">No invoices in this range</td></tr>
                  )}
                  {invoices.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3 text-slate-400">{fmtDate(r.date)}</td>
                      <td className="px-5 py-3 text-slate-300">{r.patient_name}</td>
                      <td className="px-5 py-3 font-semibold text-slate-200">₹{Number(r.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
