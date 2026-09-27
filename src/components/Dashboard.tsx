import {
  estimateFuelDurationDays,
  estimateFuelRangeKm,
  getAverageEfficiency,
  getCostPerDay,
  getCurrentMonthCarpoolSavings,
  getCurrentMonthKm,
  getCurrentMonthNetSpent,
  getCurrentMonthSavings,
  getCurrentMonthSpent,
  getCycleBounds,
  getLatestEfficiency,
  getProjectedMonthSavings,
  getTotalCarpoolSavings,
} from '../lib/calculations'
import {
  formatCurrency,
  formatDateRange,
  formatDays,
  formatKm,
  formatKmPerLiter,
  formatKwacha,
  formatLiters,
} from '../lib/format'
import type { CarpoolContribution, FuelLog, Settings } from '../types'

interface DashboardProps {
  logs: FuelLog[]
  carpoolContributions: CarpoolContribution[]
  settings: Settings
  onLogFuel: () => void
  onLogCarpool: () => void
  onOpenSettings: () => void
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Dashboard({
  logs,
  carpoolContributions,
  settings,
  onLogFuel,
  onLogCarpool,
  onOpenSettings,
}: DashboardProps) {
  const cycleStartDay = settings.payCycleStartDay || 1
  const usingPayCycle = cycleStartDay > 1
  const periodLabel = usingPayCycle ? 'this cycle' : 'this month'
  const cycleBounds = getCycleBounds(new Date(), cycleStartDay)
  const periodRange = usingPayCycle ? formatDateRange(cycleBounds.start, cycleBounds.end) : null

  const spent = getCurrentMonthSpent(logs, new Date(), cycleStartDay)
  const budget = settings.monthlyBudget
  const remaining = budget - spent
  const costPerDay = getCostPerDay(logs, settings.fuelPricePerLiter)
  const latestEfficiency = getLatestEfficiency(logs)
  const averageEfficiency = getAverageEfficiency(logs)
  const lastLog = [...logs].sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastLogEstimate = lastLog ? estimateFuelDurationDays(lastLog.liters, logs) : null
  const lastLogRangeEstimate = lastLog ? estimateFuelRangeKm(lastLog.liters, logs) : null
  const monthKm = getCurrentMonthKm(logs, new Date(), cycleStartDay)

  const monthlyCarpoolSavings = getCurrentMonthCarpoolSavings(carpoolContributions, new Date(), cycleStartDay)
  const totalCarpoolSavings = getTotalCarpoolSavings(carpoolContributions)
  const monthSavings = getCurrentMonthSavings(logs, carpoolContributions, budget, new Date(), cycleStartDay)
  const projectedSavings = getProjectedMonthSavings(logs, budget, settings.fuelPricePerLiter, new Date(), cycleStartDay)
  const netSpent = getCurrentMonthNetSpent(logs, carpoolContributions, new Date(), cycleStartDay)
  const budgetUsedPct = budget > 0 ? (spent / budget) * 100 : null

  return (
    <div className="space-y-6">
      <button
        onClick={onLogFuel}
        className="w-full rounded-2xl bg-sky-500 py-6 text-xl font-semibold text-slate-950 shadow-lg shadow-sky-500/20 active:scale-[0.99]"
      >
        + Log Fuel
      </button>

      <button
        onClick={onLogCarpool}
        className="w-full rounded-xl bg-emerald-500/90 py-3 text-sm font-semibold text-slate-950 active:scale-[0.99]"
      >
        + Log Carpool Contribution
      </button>

      {settings.fuelPricePerLiter <= 0 && (
        <button
          onClick={onOpenSettings}
          className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-300"
        >
          Set your fuel price in Settings to unlock cost calculations.
        </button>
      )}

      {usingPayCycle && (
        <p className="text-center text-xs text-slate-500">Current pay cycle: {periodRange}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={usingPayCycle ? 'Cycle budget' : 'Monthly budget'} value={budget > 0 ? formatCurrency(budget) : '—'} />
        <StatCard
          label={`Spent ${periodLabel}`}
          value={formatCurrency(spent)}
          hint={
            budget > 0
              ? `${formatCurrency(Math.abs(remaining))} ${remaining >= 0 ? 'left' : 'over'}`
              : undefined
          }
        />
        <StatCard
          label="Cost per day"
          value={costPerDay !== null ? formatCurrency(costPerDay) : '—'}
          hint="Based on avg. weekly mileage & efficiency"
        />
        <StatCard
          label="Avg. fuel efficiency"
          value={averageEfficiency !== null ? formatKmPerLiter(averageEfficiency) : '—'}
          hint="Used to determine cost per day"
        />
        <StatCard
          label="Last trip efficiency"
          value={latestEfficiency !== null ? formatKmPerLiter(latestEfficiency) : '—'}
        />
        <StatCard
          label="Carpool savings"
          value={formatKwacha(monthlyCarpoolSavings)}
          hint={totalCarpoolSavings > 0 ? `${formatKwacha(totalCarpoolSavings)} all-time` : undefined}
        />
        <StatCard
          label={`Savings ${periodLabel}`}
          value={monthSavings !== null ? formatCurrency(monthSavings) : '—'}
          hint={
            projectedSavings !== null
              ? `Projected ${projectedSavings >= 0 ? 'savings' : 'overspend'} at ${usingPayCycle ? 'cycle end' : 'month end'}: ${formatCurrency(Math.abs(projectedSavings))}`
              : 'Set a monthly budget to track savings'
          }
        />
        <StatCard label={`Distance ${periodLabel}`} value={monthKm > 0 ? formatKm(monthKm) : '—'} />
        <StatCard
          label="Estimated range"
          value={lastLogRangeEstimate !== null ? formatKm(lastLogRangeEstimate) : '—'}
          hint="From your last fill-up, at avg. efficiency"
        />
        <StatCard
          label="Net spend after carpooling"
          value={formatCurrency(netSpent)}
          hint={monthlyCarpoolSavings > 0 ? `${formatCurrency(spent)} minus ${formatKwacha(monthlyCarpoolSavings)} collected` : 'No carpool savings collected yet'}
        />
        <StatCard
          label="Spent vs budget"
          value={budget > 0 ? `${formatCurrency(spent)} / ${formatCurrency(budget)}` : '—'}
          hint={budgetUsedPct !== null ? `${Math.round(budgetUsedPct)}% of budget used` : 'Set a monthly budget to compare'}
        />
      </div>

      {lastLog && lastLogEstimate !== null && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated fuel duration</p>
          <p className="mt-1 text-lg text-slate-100">
            Your last {formatLiters(lastLog.liters)} fill-up should last about{' '}
            <span className="font-semibold">{formatDays(lastLogEstimate)}</span>
            {lastLogRangeEstimate !== null && (
              <>
                {' '}(~<span className="font-semibold">{formatKm(lastLogRangeEstimate)}</span>)
              </>
            )}
            .
          </p>
        </div>
      )}
    </div>
  )
}
