import { estimateFuelRangeKm, getEfficiencyByLogId, sortLogsByDate } from '../lib/calculations'
import { confirmDeleteLog } from '../lib/confirm'
import { formatCurrency, formatKm, formatKmPerLiter, formatLiters } from '../lib/format'
import type { FuelLog } from '../types'

interface LogHistoryProps {
  logs: FuelLog[]
  onDelete: (id: string) => void
}

export function LogHistory({ logs, onDelete }: LogHistoryProps) {
  const sorted = [...sortLogsByDate(logs)].reverse()
  const efficiencyByLogId = getEfficiencyByLogId(logs)

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-500">
        No fuel logs yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((log) => {
        const trip = efficiencyByLogId.get(log.id)
        const rangeEstimate = trip ? null : estimateFuelRangeKm(log.liters, logs)
        return (
          <div key={log.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div>
              <p className="font-medium text-slate-100">{log.date}</p>
              <p className="text-sm text-slate-400">
                {formatLiters(log.liters)} · {formatCurrency(log.cost)}
              </p>
              {trip && (
                <p className="mt-1 text-xs text-sky-400">
                  {formatKm(log.tripKm!)} until next fill-up ({trip.nextLog.date}) ·{' '}
                  {formatKmPerLiter(trip.kmPerLiter)}
                </p>
              )}
              {rangeEstimate !== null && (
                <p className="mt-1 text-xs text-sky-400">
                  Est. range: ~{formatKm(rangeEstimate)} at avg. efficiency
                </p>
              )}
            </div>
            <button
              onClick={() => confirmDeleteLog(log.date) && onDelete(log.id)}
              className="rounded-lg px-3 py-1 text-sm text-red-400"
              aria-label={`Delete log from ${log.date}`}
            >
              Delete
            </button>
          </div>
        )
      })}
    </div>
  )
}
