import { confirmDeleteCarpool } from '../lib/confirm'
import { formatKwacha } from '../lib/format'
import type { CarpoolContribution } from '../types'

interface CarpoolHistoryProps {
  carpoolContributions: CarpoolContribution[]
  onDelete: (id: string) => void
}

export function CarpoolHistory({ carpoolContributions, onDelete }: CarpoolHistoryProps) {
  const sorted = [...carpoolContributions].sort((a, b) => b.date.localeCompare(a.date))

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-500">
        No carpool contributions yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div>
            <p className="font-medium text-slate-100">{c.date}</p>
            <p className="text-sm text-slate-400">{formatKwacha(c.amount)}</p>
          </div>
          <button
            onClick={() => confirmDeleteCarpool(c.date) && onDelete(c.id)}
            className="rounded-lg px-3 py-1 text-sm text-red-400"
            aria-label={`Delete carpool contribution from ${c.date}`}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
