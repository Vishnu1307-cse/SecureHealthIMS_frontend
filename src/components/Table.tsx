export const Table = ({
  headers,
  rows,
}: {
  headers: string[]
  rows: React.ReactNode
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/70 text-slate-300">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70 text-slate-200">{rows}</tbody>
      </table>
    </div>
  )
}
