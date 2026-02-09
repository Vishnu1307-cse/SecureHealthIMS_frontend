export const Card = ({
  title,
  children,
  actions,
}: {
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
}) => {
  return (
    <div className="card p-6">
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}
