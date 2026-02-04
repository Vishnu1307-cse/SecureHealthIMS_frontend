export const Modal = ({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  actions?: React.ReactNode
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="card w-full max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button className="ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
      </div>
    </div>
  )
}
