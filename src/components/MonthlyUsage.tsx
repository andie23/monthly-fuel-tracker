import { getMonthlyCarpoolSavings, getMonthlyUsage } from '../lib/calculations'
import { formatCurrency, formatKm, formatKwacha, formatLiters } from '../lib/format'
import type { CarpoolContribution, FuelLog } from '../types'

interface MonthlyUsageProps {
  logs: FuelLog[]
  carpoolContributions: CarpoolContribution[]
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function MonthlyUsage({ logs, carpoolContributions }: MonthlyUsageProps) {
  const usage = getMonthlyUsage(logs)
  const carpoolByMonth = new Map(getMonthlyCarpoolSavings(carpoolContributions).map((c) => [c.month, c]))

  const months = [...new Set([...usage.map((u) => u.month), ...carpoolByMonth.keys()])].sort((a, b) =>
    b.localeCompare(a),
  )

  if (months.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-500">
        No fuel logs yet.
      </div>
    )
  }

  const usageByMonth = new Map(usage.map((u) => [u.month, u]))

  return (
    <div className="space-y-3">
      {months.map((month) => {
        const entry = usageByMonth.get(month)
        const carpool = carpoolByMonth.get(month)
        return (
          <div key={month} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-100">{formatMonth(month)}</p>
              {entry && (
                <p className="text-sm text-slate-500">
                  {entry.fillCount} fill-up{entry.fillCount === 1 ? '' : 's'}
                </p>
              )}
            </div>
            {(entry || carpool) && (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {entry && (
                  <p className="text-slate-400">
                    Liters: <span className="text-slate-100">{formatLiters(entry.liters)}</span>
                  </p>
                )}
                {entry && (
                  <p className="text-slate-400">
                    Cost: <span className="text-slate-100">{formatCurrency(entry.cost)}</span>
                  </p>
                )}
                {entry && entry.km > 0 && (
                  <p className="text-slate-400">
                    Distance: <span className="text-slate-100">{formatKm(entry.km)}</span>
                  </p>
                )}
                {carpool && (
                  <p className="text-slate-400">
                    Carpool savings: <span className="text-emerald-400">{formatKwacha(carpool.amount)}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
